package com.google.firebase.firestore;

import java.lang.reflect.Field;
import java.lang.reflect.Method;

public final class TestDocumentSnapshotFactory {
    private TestDocumentSnapshotFactory() {}

    public static DocumentSnapshot createDummySnapshot() {
        try {
            Class<?> unsafeClass = Class.forName("sun.misc.Unsafe");
            Field f = unsafeClass.getDeclaredField("theUnsafe");
            f.setAccessible(true);
            Object unsafe = f.get(null);
            Method allocateInstance = unsafeClass.getMethod("allocateInstance", Class.class);
            return (DocumentSnapshot) allocateInstance.invoke(unsafe, DocumentSnapshot.class);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
