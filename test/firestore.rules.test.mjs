import fs from "node:fs";
import { after, before, test } from "node:test";
import { strict as assert } from "node:assert";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, collection, Timestamp } from "firebase/firestore";

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

function waitForSnapshot(ref, predicate, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      unsubscribe();
      reject(new Error("waitForSnapshot timed out"));
    }, timeoutMs);

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      try {
        if (predicate(snapshot)) {
          clearTimeout(timer);
          unsubscribe();
          resolve(snapshot);
        }
      } catch (err) {
        clearTimeout(timer);
        unsubscribe();
        reject(err);
      }
    }, (error) => {
      clearTimeout(timer);
      unsubscribe();
      reject(error);
    });
  });
}

// 15. Real-time: owner adds product -> customer sees it via snapshot listener
test("15. Real-time: owner adds product -> customer sees it via snapshot listener", async () => {
  const dbCust = testEnv.authenticatedContext("customer-1").firestore();
  const dbOwner = testEnv.authenticatedContext("owner-1").firestore();

  // Create initial product
  const productRefOwner = doc(dbOwner, "products/product-rt-feed");
  const productRefCust = doc(dbCust, "products/product-rt-feed");

  await setDoc(productRefOwner, validProduct({
    businessId: "business-1",
    name: "Realtime Non Init",
    price: 7000
  }));

  // Customer sets up real-time listener for this approved business's product
  const watchPromise = waitForSnapshot(productRefCust, (snap) => snap.data()?.name === "Realtime Non Updated");

  // Owner updates product in real time
  await updateDoc(productRefOwner, {
    name: "Realtime Non Updated",
    price: 8500
  });

  const snap = await watchPromise;
  assert.equal(snap.data().name, "Realtime Non Updated");
  assert.equal(snap.data().price, 8500);
});

// 16. Real-time: customer orders -> owner sees it instantly
test("16. Real-time: customer orders -> owner sees it instantly", async () => {
  const dbCust = testEnv.authenticatedContext("customer-1").firestore();
  const dbOwner = testEnv.authenticatedContext("owner-1").firestore();

  const orderRefCust = doc(dbCust, "orders/order-rt-instant");
  const orderRefOwner = doc(dbOwner, "orders/order-rt-instant");

  await setDoc(orderRefCust, {
    customerId: "customer-1",
    businessId: "business-1",
    businessName: "Nonvoyxona 1",
    productId: "product-approved",
    productName: "Patir Non",
    quantity: 3,
    totalPrice: 24000,
    status: "new",
    pickupTime: Timestamp.fromMillis(Date.now() + 3600000),
    createdAt: Timestamp.now()
  });

  // Owner sets up real-time listener for orders of their business
  const watchPromise = waitForSnapshot(orderRefOwner, (snap) => snap.data()?.customerId === "customer-1");
  const snap = await watchPromise;
  assert.equal(snap.data().totalPrice, 24000);
  assert.equal(snap.data().status, "new");
});

// 17. Real-time: owner changes status -> customer sees it
test("17. Real-time: owner changes status -> customer sees it", async () => {
  const dbCust = testEnv.authenticatedContext("customer-1").firestore();
  const dbOwner = testEnv.authenticatedContext("owner-1").firestore();

  const orderDocCust = doc(dbCust, "orders/order-rt-instant");
  const orderDocOwner = doc(dbOwner, "orders/order-rt-instant");

  const watchReady = waitForSnapshot(orderDocCust, (snap) => snap.data()?.status === "ready");

  await updateDoc(orderDocOwner, {
    status: "ready"
  });

  const readySnap = await watchReady;
  assert.equal(readySnap.data().status, "ready");

  const watchDone = waitForSnapshot(orderDocCust, (snap) => snap.data()?.status === "done");
  await updateDoc(orderDocOwner, {
    status: "done"
  });

  const doneSnap = await watchDone;
  assert.equal(doneSnap.data().status, "done");
});

// 18. Business Owner can create, read, and delete expense for their own business
test("18. Owner can create, read, and delete expense for their own business", async () => {
  const dbOwner = testEnv.authenticatedContext("owner-1").firestore();
  const expenseRef = doc(dbOwner, "expenses/expense-1");

  // Create
  await assertSucceeds(setDoc(expenseRef, {
    businessId: "business-1",
    title: "Un va xamirturush",
    amount: 150000,
    category: "Xomashyo",
    createdAt: Timestamp.now()
  }));

  // Read
  const snap = await assertSucceeds(getDoc(expenseRef));
  assert.equal(snap.data().amount, 150000);

  // Update
  await assertSucceeds(updateDoc(expenseRef, { amount: 160000 }));

  // Delete
  await assertSucceeds(deleteDoc(expenseRef));
});

// 19. Unauthorized user cannot create, read, or delete expense for another business
test("19. Customer or other owner cannot access expenses of another business", async () => {
  const dbCust = testEnv.authenticatedContext("customer-1").firestore();
  const dbOtherOwner = testEnv.authenticatedContext("owner-2").firestore();

  // Customer cannot create expense for business-1
  await assertFails(setDoc(doc(dbCust, "expenses/expense-fraud-1"), {
    businessId: "business-1",
    title: "Fake expense",
    amount: 99999,
    category: "Xomashyo",
    createdAt: Timestamp.now()
  }));

  // Other owner cannot create expense for business-1
  await assertFails(setDoc(doc(dbOtherOwner, "expenses/expense-fraud-2"), {
    businessId: "business-1",
    title: "Other owner expense",
    amount: 50000,
    category: "Xomashyo",
    createdAt: Timestamp.now()
  }));

  // Customer cannot read owner-1's expense
  await assertFails(getDoc(doc(dbCust, "expenses/expense-1")));

  // Other owner cannot read owner-1's expense
  await assertFails(getDoc(doc(dbOtherOwner, "expenses/expense-1")));
});

// 20. Public product doc forbids costPrice
test("20. Public product doc forbids costPrice", async () => {
  const dbOwner = testEnv.authenticatedContext("owner-1").firestore();
  // Attempting to write costPrice on public product doc must fail
  await assertFails(setDoc(doc(dbOwner, "products/product-with-cost"), validProduct({
    costPrice: 5000
  })));
});

// 21. Owner can write and read products/{id}/private/cost
test("21. Owner can manage products/{id}/private/cost", async () => {
  const dbOwner = testEnv.authenticatedContext("owner-1").firestore();
  const costRef = doc(dbOwner, "products/product-approved/private/cost");

  await assertSucceeds(setDoc(costRef, {
    costPrice: 5000,
    updatedAt: Timestamp.now()
  }));

  const snap = await assertSucceeds(getDoc(costRef));
  assert.equal(snap.data().costPrice, 5000);
});

// 22. Customer cannot read products/{id}/private/cost
test("22. Customer cannot read products/{id}/private/cost", async () => {
  const dbCust = testEnv.authenticatedContext("customer-1").firestore();
  await assertFails(getDoc(doc(dbCust, "products/product-approved/private/cost")));
});

// 23. Customer can cancel while pending, but cannot set status to completed or accepted
test("23. Customer status transitions: only pending -> cancelled allowed", async () => {
  const dbCust = testEnv.authenticatedContext("customer-1").firestore();
  const orderRef = doc(dbCust, "orders/order-pending-test");

  // Create order with pending status
  await assertSucceeds(setDoc(orderRef, {
    customerId: "customer-1",
    businessId: "business-1",
    businessName: "Nonvoyxona 1",
    productId: "product-approved",
    productName: "Patir Non",
    quantity: 1,
    status: "pending",
    paymentStatus: "unpaid",
    createdAt: Timestamp.now()
  }));

  // Customer cannot escalate to completed
  await assertFails(updateDoc(orderRef, { status: "completed" }));

  // Customer cannot escalate to accepted
  await assertFails(updateDoc(orderRef, { status: "accepted" }));

  // Customer CAN cancel while pending
  await assertSucceeds(updateDoc(orderRef, { status: "cancelled" }));
});

// 24. Customer cannot cancel once order is accepted by owner
test("24. Customer cannot cancel order once status is accepted", async () => {
  const dbCust = testEnv.authenticatedContext("customer-1").firestore();
  const dbOwner = testEnv.authenticatedContext("owner-1").firestore();
  const orderRef = doc(dbCust, "orders/order-accepted-test");

  // Customer creates order in pending status
  await setDoc(orderRef, {
    customerId: "customer-1",
    businessId: "business-1",
    businessName: "Nonvoyxona 1",
    productId: "product-approved",
    productName: "Patir Non",
    quantity: 1,
    status: "pending",
    paymentStatus: "unpaid",
    createdAt: Timestamp.now()
  });

  // Owner accepts the order
  await updateDoc(doc(dbOwner, "orders/order-accepted-test"), {
    status: "accepted"
  });

  // Customer cannot cancel accepted order
  await assertFails(updateDoc(doc(dbCust, "orders/order-accepted-test"), {
    status: "cancelled"
  }));
});

// 25. Line item unitPrice must match product sellingPrice
test("25. Order line item unitPrice must match product sellingPrice", async () => {
  const dbCust = testEnv.authenticatedContext("customer-1").firestore();
  const dbOwner = testEnv.authenticatedContext("owner-1").firestore();
  const itemRef = doc(dbCust, "orders/order-pending-test/items/item-1");

  // product-approved price is 8000. Customer trying 1000 must fail
  await assertFails(setDoc(itemRef, {
    productId: "product-approved",
    name: "Patir Non",
    qty: 2,
    unitPrice: 1000
  }));

  // Customer using exact sellingPrice 8000 succeeds
  await assertSucceeds(setDoc(itemRef, {
    productId: "product-approved",
    name: "Patir Non",
    qty: 2,
    unitPrice: 8000
  }));

  // Owner writes unitCost snapshot upon completion
  const ownerItemRef = doc(dbOwner, "orders/order-pending-test/items/item-1");
  await assertSucceeds(updateDoc(ownerItemRef, {
    unitCost: 5000
  }));
});



