"""
KAIROS AI Model Training Script
================================
Trains a MobileNetV3Small model on PlantVillage dataset for plant disease detection.

Usage:
    cd backend
    python -m app.ai.train_model

Dataset:
    Download PlantVillage from: https://www.kaggle.com/datasets/emmarex/plantdisease
    Extract to: backend/data/PlantVillage/

    Structure:
        data/PlantVillage/
        ├── Apple___Apple_scab/
        ├── Apple___healthy/
        ├── Tomato___Early_blight/
        └── ...
"""

import os
import sys
import json
import numpy as np
from pathlib import Path

DATA_DIR   = Path("data/PlantVillage")
MODEL_DIR  = Path("models")
MODEL_PATH = MODEL_DIR / "plant_disease_model.h5"
CLASSES_PATH = MODEL_DIR / "class_names.txt"

# Training hyperparameters
IMG_SIZE    = (224, 224)
BATCH_SIZE  = 32
EPOCHS      = 20
LR          = 1e-4
VALIDATION_SPLIT = 0.2


def train():
    try:
        import tensorflow as tf
        from tensorflow import keras
    except ImportError:
        print("❌ TensorFlow not found. Install: pip install tensorflow")
        sys.exit(1)

    if not DATA_DIR.exists():
        print(f"❌ Dataset not found at {DATA_DIR}")
        print("   Download PlantVillage from: https://www.kaggle.com/datasets/emmarex/plantdisease")
        sys.exit(1)

    MODEL_DIR.mkdir(exist_ok=True)

    print("📂 Loading dataset...")
    classes = sorted([d.name for d in DATA_DIR.iterdir() if d.is_dir()])
    print(f"   Found {len(classes)} classes")

    # Save class names
    with open(CLASSES_PATH, 'w') as f:
        f.write('\n'.join(classes))

    # Data generators
    datagen = keras.preprocessing.image.ImageDataGenerator(
        rescale=1.0 / 255,
        validation_split=VALIDATION_SPLIT,
        horizontal_flip=True,
        vertical_flip=True,
        rotation_range=20,
        zoom_range=0.2,
        brightness_range=[0.8, 1.2],
        width_shift_range=0.1,
        height_shift_range=0.1,
    )

    train_gen = datagen.flow_from_directory(
        DATA_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE,
        subset='training', class_mode='categorical', shuffle=True,
    )
    val_gen = datagen.flow_from_directory(
        DATA_DIR, target_size=IMG_SIZE, batch_size=BATCH_SIZE,
        subset='validation', class_mode='categorical', shuffle=False,
    )

    # Build MobileNetV3Small with transfer learning
    print("🧠 Building MobileNetV3Small model...")
    base_model = keras.applications.MobileNetV3Small(
        input_shape=(*IMG_SIZE, 3),
        include_top=False,
        weights='imagenet',
        include_preprocessing=True,
    )
    base_model.trainable = False  # Freeze for initial training

    model = keras.Sequential([
        base_model,
        keras.layers.GlobalAveragePooling2D(),
        keras.layers.BatchNormalization(),
        keras.layers.Dense(256, activation='relu'),
        keras.layers.Dropout(0.4),
        keras.layers.Dense(len(classes), activation='softmax'),
    ])

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=LR),
        loss='categorical_crossentropy',
        metrics=['accuracy', keras.metrics.TopKCategoricalAccuracy(k=3, name='top3_accuracy')],
    )

    model.summary()

    callbacks = [
        keras.callbacks.ModelCheckpoint(str(MODEL_PATH), save_best_only=True, monitor='val_accuracy', verbose=1),
        keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=5, restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-6, verbose=1),
        keras.callbacks.TensorBoard(log_dir='logs/phase1'),
    ]

    print(f"\n🚀 Phase 1: Training top layers ({EPOCHS} epochs)...")
    history1 = model.fit(
        train_gen, validation_data=val_gen,
        epochs=EPOCHS, callbacks=callbacks, verbose=1,
    )

    # Phase 2: Fine-tune last 20 layers of base model
    print("\n🔓 Phase 2: Fine-tuning base model...")
    base_model.trainable = True
    for layer in base_model.layers[:-20]:
        layer.trainable = False

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=LR / 10),
        loss='categorical_crossentropy',
        metrics=['accuracy', keras.metrics.TopKCategoricalAccuracy(k=3, name='top3_accuracy')],
    )

    callbacks[3] = keras.callbacks.TensorBoard(log_dir='logs/phase2')
    history2 = model.fit(
        train_gen, validation_data=val_gen,
        epochs=10, callbacks=callbacks, verbose=1,
    )

    # Save final model
    model.save(str(MODEL_PATH))
    print(f"\n✅ Model saved to {MODEL_PATH}")

    # Print final accuracy
    val_acc = max(history2.history.get('val_accuracy', [0]))
    print(f"   Validation Accuracy: {val_acc * 100:.2f}%")
    print(f"\n📋 Class names saved to {CLASSES_PATH}")
    print("   Run the backend: python run.py")


if __name__ == '__main__':
    train()
