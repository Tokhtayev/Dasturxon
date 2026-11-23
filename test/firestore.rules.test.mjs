import fs from "node:fs";
import { after, before, test } from "node:test";
import { strict as assert } from "node:assert";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";

const projectId = "demo-dasturxon";
let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: fs.readFileSync("firestore.rules", "utf8")
    }
  });

  // Seed initial test data with security rules disabled
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    // 1. Users
    await setDoc(doc(db, "users/customer-1"), {
      fullName: "Test Customer 1",
      email: "customer1@example.test",
      role: "customer",
      createdAt: Timestamp.now()
    });
    await setDoc(doc(db, "users/customer-2"), {
      fullName: "Test Customer 2",
      email: "customer2@example.test",
      role: "customer",
      createdAt: Timestamp.now()
    });
    await setDoc(doc(db, "users/owner-1"), {
      fullName: "Test Owner 1",
      email: "owner1@example.test",
      role: "owner",
      createdAt: Timestamp.now()
    });
    await setDoc(doc(db, "users/owner-2"), {
      fullName: "Test Owner 2",
      email: "owner2@example.test",
      role: "owner",
      createdAt: Timestamp.now()
    });
    await setDoc(doc(db, "users/admin-1"), {
      fullName: "Test Admin",
      email: "admin@example.test",
      role: "admin",
      createdAt: Timestamp.now()
    });

    // 2. Businesses
    await setDoc(doc(db, "businesses/business-1"), {
      ownerId: "owner-1",
      name: "Nonvoyxona 1",
      type: "bakery",
      address: "Yunusobod 4-mavze",
      phone: "+998901111111",
      status: "approved",
      createdAt: Timestamp.now()
    });
    await setDoc(doc(db, "businesses/business-2"), {
      ownerId: "owner-2",
      name: "Nonvoyxona 2",
      type: "bakery",
      address: "Yunusobod 7-mavze",
      phone: "+998902222222",
      status: "pending",
      createdAt: Timestamp.now()
    });

    // 3. Products
    await setDoc(doc(db, "products/product-approved"), {
      businessId: "business-1",
      businessName: "Nonvoyxona 1",
      businessType: "bakery",
      businessAddress: "Yunusobod 4-mavze",
      businessPhone: "+998901111111",
      name: "Patir Non",
      description: "Issiq patir non",
      price: 8000,
      status: "available",
      stock: 50,
      discountPercent: 0,
      updatedAt: Timestamp.now()
    });
    await setDoc(doc(db, "products/product-pending"), {
      businessId: "business-2",
      businessName: "Nonvoyxona 2",
      businessType: "bakery",
      businessAddress: "Yunusobod 7-mavze",
      businessPhone: "+998902222222",
      name: "Yopgan Non",
      description: "Tandir non",
      price: 5000,
      status: "available",
      stock: 30,
      discountPercent: 0,
      updatedAt: Timestamp.now()
    });

    // 4. Orders
    await setDoc(doc(db, "orders/order-1"), {
      customerId: "customer-1",
      businessId: "business-1",
      businessName: "Nonvoyxona 1",
      productId: "product-approved",
      quantity: 2,
      items: [{
        productId: "product-approved",
        name: "Patir Non",
        quantity: 2,
        priceAtOrder: 8000
      }],
      totalPrice: 16000,
      status: "new",
      pickupTime: Timestamp.fromMillis(Date.now() + 3600000),
      createdAt: Timestamp.now()
    });
  });
});

after(async () => {
  await testEnv?.cleanup();
});

function validProduct(overrides = {}) {
  return {
    businessId: "business-1",
    businessName: "Nonvoyxona 1",
    businessType: "bakery",
    businessAddress: "Yunusobod 4-mavze",
    businessPhone: "+998901111111",
    name: "Yangi Non",
    description: "Tandir noni",
    price: 6000,
    status: "available",
    stock: 20,
    discountPercent: 0,
    updatedAt: Timestamp.now(),
    ...overrides
  };
}

// 1. Customer cannot create a product
test("1. Customer cannot create a product", async () => {
  const db = testEnv.authenticatedContext("customer-1").firestore();
  await assertFails(setDoc(doc(db, "products/product-cust-created"), validProduct()));
});

// 2. Customer cannot edit another user's order
test("2. Customer cannot edit another user's order", async () => {
  const db = testEnv.authenticatedContext("customer-2").firestore();
  await assertFails(updateDoc(doc(db, "orders/order-1"), {
    status: "cancelled"
  }));
});

// 3. Owner cannot edit another owner's products
test("3. Owner cannot edit another owner's products", async () => {
  const db = testEnv.authenticatedContext("owner-2").firestore();
  await assertFails(updateDoc(doc(db, "products/product-approved"), {
    price: 9000,
    updatedAt: Timestamp.now()
  }));
});

// 4. Owner cannot approve their own business
test("4. Owner cannot approve their own business", async () => {
  const db = testEnv.authenticatedContext("owner-2").firestore();
  await assertFails(updateDoc(doc(db, "businesses/business-2"), {
    status: "approved"
  }));
});

// 5. Admin can approve a business
test("5. Admin can approve a business", async () => {
  const db = testEnv.authenticatedContext("admin-1").firestore();
  await assertSucceeds(updateDoc(doc(db, "businesses/business-2"), {
    status: "approved"
  }));
  // Reset status back to pending so business-2 remains unapproved for test 8
  await updateDoc(doc(db, "businesses/business-2"), {
    status: "pending"
  });
});

// 6. Approved business owner can publish a product
test("6. Approved business owner can publish a product", async () => {
  const db = testEnv.authenticatedContext("owner-1").firestore();
  await assertSucceeds(setDoc(doc(db, "products/product-owner1-pub"), validProduct({
    businessId: "business-1"
  })));
});

// 7. Customer can read products from approved businesses
test("7. Customer can read products from approved businesses", async () => {
  const db = testEnv.authenticatedContext("customer-1").firestore();
  await assertSucceeds(getDoc(doc(db, "products/product-approved")));
});

// 8. Customer cannot read products from unapproved businesses
test("8. Customer cannot read products from unapproved businesses", async () => {
  const db = testEnv.authenticatedContext("customer-1").firestore();
  await assertFails(getDoc(doc(db, "products/product-pending")));
});

// 9. Unauthenticated user cannot access protected data
test("9. Unauthenticated user cannot access protected data", async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  // Cannot read orders
  await assertFails(getDoc(doc(db, "orders/order-1")));
  // Cannot read users
  await assertFails(getDoc(doc(db, "users/customer-1")));
  // Cannot read unapproved business
  await assertFails(getDoc(doc(db, "businesses/business-2")));
});

// 10. Owner can update order status only for their own business
test("10. Owner can update order status only for their own business", async () => {
  // owner-2 tries to update owner-1's business order -> FAIL
  const dbOwner2 = testEnv.authenticatedContext("owner-2").firestore();
  await assertFails(updateDoc(doc(dbOwner2, "orders/order-1"), {
    status: "accepted"
  }));

  // owner-1 updates their own business order -> SUCCEED
  const dbOwner1 = testEnv.authenticatedContext("owner-1").firestore();
  await assertSucceeds(updateDoc(doc(dbOwner1, "orders/order-1"), {
    status: "accepted"
  }));
});

// 11. Role escalation prevention on creation
test("11. User cannot create profile with admin role", async () => {
  const db = testEnv.authenticatedContext("attacker-1").firestore();
  await assertFails(setDoc(doc(db, "users/attacker-1"), {
    fullName: "Attacker",
    email: "attacker@example.test",
    role: "admin",
    createdAt: Timestamp.now()
  }));
});

// 12. Role escalation prevention on update
test("12. User cannot escalate role to admin on update", async () => {
  const db = testEnv.authenticatedContext("customer-1").firestore();
  await assertFails(updateDoc(doc(db, "users/customer-1"), {
    role: "admin"
  }));
});

// 13. Writing to another user's document prevention
test("13. User cannot write to another user's document", async () => {
  const db = testEnv.authenticatedContext("customer-1").firestore();
  await assertFails(updateDoc(doc(db, "users/customer-2"), {
    fullName: "Hacked Name"
  }));
});

// 14. Reading others' orders prevention
test("14. Customer cannot read another customer's order", async () => {
  const db = testEnv.authenticatedContext("customer-2").firestore();
  await assertFails(getDoc(doc(db, "orders/order-1")));
});

