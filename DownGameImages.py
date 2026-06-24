import requests
import time
import os


def clear_image_dir(IMAGE_DIR):
    if os.path.exists(IMAGE_DIR):
        for f in os.listdir(IMAGE_DIR):
            try:
                os.remove(os.path.join(IMAGE_DIR, f))
            except:
                pass


def download_image(IMAGE_DIR, img_url, keyword, plat_num):
    try:
        filename = f"{keyword}_{plat_num}_{int(time.time() * 1000)}.jpg"
        save_path = os.path.join(IMAGE_DIR, filename)

        resp = requests.get(img_url, timeout=10, stream=True)
        if resp.status_code == 200:
            with open(save_path, 'wb') as f:
                for chunk in resp.iter_content(1024):
                    f.write(chunk)
            return f"/static/images/{filename}"
    except:
        pass
    return ""
