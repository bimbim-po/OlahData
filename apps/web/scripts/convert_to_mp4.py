import cv2
import os
import shutil

artifact_dir = r"C:\Users\ThinkPad X1 Yoga\.gemini\antigravity\brain\3238dc4e-fb77-4692-9957-e530fba398b7"
os.makedirs(artifact_dir, exist_ok=True)

files = [
    ("public/iklan-olahdata-16-9.webm", "public/iklan-olahdata-16-9.mp4", "iklan-olahdata-16-9"),
    ("public/iklan-olahdata-9-16.webm", "public/iklan-olahdata-9-16.mp4", "iklan-olahdata-9-16"),
]

for in_file, out_file, base_name in files:
    if not os.path.exists(in_file):
        print(f"Skipping {in_file} (not found yet)")
        continue

    print(f"Mengonversi {in_file} ke {out_file}...")
    cap = cv2.VideoCapture(in_file)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1280
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 720
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(out_file, fourcc, fps, (width, height))

    count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        out.write(frame)
        count += 1

    cap.release()
    out.release()
    print(f"Konversi {out_file} selesai: {count} frame")

    shutil.copy2(out_file, os.path.join(artifact_dir, f"{base_name}.mp4"))
    shutil.copy2(in_file, os.path.join(artifact_dir, f"{base_name}.webm"))
    print(f"Tersalin ke artifact: {base_name}.mp4 & .webm")

print("Seluruh pemrosesan video selesai!")
