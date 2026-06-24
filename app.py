from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import time
import os

from Tools import to_dict
from SearchGames import old_man, hai_luo, huo_qiang_shou
# from SearchGameDetails import
from DownGameImages import clear_image_dir, download_image

app = Flask(__name__)
CORS(app)  # 允许跨域，前端直接调用

IMAGE_DIR = "./static/images"
os.makedirs(IMAGE_DIR, exist_ok=True)


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/api/search', methods=['POST'])
def search_games():
    data = request.get_json()
    keyword = data.get('keyword', '').strip()
    platform = data.get('platform', '').strip()  # 获取平台

    print(keyword, platform)
    if not keyword or not platform:
        return jsonify({"code": 400, "msg": "参数错误", "data": [[], [], []]})

    try:
        clear_image_dir(IMAGE_DIR)
        time.sleep(0.1)
        # 三个函数全部执行完再返回
        data1 = to_dict(old_man(platform, keyword, 2))
        # print(data1)
        data2 = to_dict(hai_luo(platform, keyword, 2))
        # print(data2)
        data3 = to_dict(huo_qiang_shou(platform, keyword, 2))
        # print(data3)
        # print([data1, data2, data3])

        def process_images(items, plat_num):
            res = []
            for it in items:
                url = it.get("img_url", "")
                local_url = download_image(
                    IMAGE_DIR, url, keyword, plat_num) if url else ""
                res.append({
                    **it,
                    "img_url": local_url if local_url else "https://picsum.photos/44/44?gray"
                })
            return res

        # data1_local = process_images(data1, 1)
        # data2_local = process_images(data2, 2)
        # data3_local = process_images(data3, 3)
        return jsonify({
            "code": 200,
            "msg": "搜索成功",
            "data": [data1, data2, data3_local]
        })
    except Exception as e:
        return jsonify({"code": 500, "msg": str(e), "data": [[], [], []]})


if __name__ == '__main__':
    app.run(debug=False)
    # app.run(debug=True)
