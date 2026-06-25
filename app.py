from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import time
import os

from Tools import to_dict
from SearchGames import old_man, hai_luo, huo_qiang_shou
from SearchGamesDefault import old_man_default, hai_luo_default, huo_qiang_shou_default
from SearchGameDetails import old_man_detail, hai_luo_detail, huo_qiang_shou_detail
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
    platform = data.get('platform', '').strip()

    print(f"搜索: keyword={keyword}, platform={platform}")
    if not platform:
        return jsonify({"code": 400, "msg": "参数错误：缺少平台参数", "data": [[], [], []]})

    try:
        clear_image_dir(IMAGE_DIR)
        time.sleep(0.1)

        if not keyword:
            data1 = to_dict(old_man_default(platform, 2))
            data2 = to_dict(hai_luo_default(platform, 2))
            data3 = to_dict(huo_qiang_shou_default(platform, 2, IMAGE_DIR))
        else:
            data1 = to_dict(old_man(platform, keyword, 2))
            data2 = to_dict(hai_luo(platform, keyword, 2))
            data3 = to_dict(huo_qiang_shou(platform, keyword, 2))

        def process_images(items, plat_num):
            res = []
            for it in items:
                url = it.get("img_url", "")
                local_url = download_image(
                    IMAGE_DIR, url, keyword or "default", plat_num) if url else ""
                res.append({
                    **it,
                    "img_url": local_url if local_url else "https://picsum.photos/44/44?gray"
                })
            return res

        data3_local = process_images(data3, 3)
        return jsonify({
            "code": 200,
            "msg": "搜索成功",
            "data": [data1, data2, data3_local]
        })
    except Exception as e:
        print(f"搜索异常: {e}")
        return jsonify({"code": 500, "msg": str(e), "data": [[], [], []]})


@app.route('/api/search_single', methods=['POST'])
def search_single_platform():
    """单平台搜索：只搜索指定平台的数据"""
    data = request.get_json()
    keyword = data.get('keyword', '').strip()
    platform = data.get('platform', '').strip()
    plat_index = data.get('plat_index', 0)

    print(
        f"单平台搜索: keyword={keyword}, platform={platform}, plat_index={plat_index}")
    if not platform:
        return jsonify({"code": 400, "msg": "参数错误：缺少平台参数", "data": []})
    if not keyword:
        return jsonify({"code": 400, "msg": "参数错误：缺少关键词", "data": []})

    try:
        # 火枪手平台搜索时清空图片（因为需要下载本地图片）
        if plat_index == 2:
            clear_image_dir(IMAGE_DIR)
            time.sleep(0.1)

        if plat_index == 0:
            result = to_dict(old_man(platform, keyword, 2))
        elif plat_index == 1:
            result = to_dict(hai_luo(platform, keyword, 2))
        elif plat_index == 2:
            result = to_dict(huo_qiang_shou(platform, keyword, 2))
            # 火枪手平台需要处理图片

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
            result = process_images(result, 3)
        else:
            return jsonify({"code": 400, "msg": "plat_index参数错误", "data": []})

        return jsonify({
            "code": 200,
            "msg": "搜索成功",
            "data": result
        })
    except Exception as e:
        print(f"单平台搜索异常: {e}")
        return jsonify({"code": 500, "msg": str(e), "data": []})


@app.route('/api/default', methods=['POST'])
def get_default_data():
    """获取各平台默认数据（keyword为空时的热门列表）"""
    data = request.get_json()
    platform = data.get('platform', '').strip()
    plat_index = data.get('plat_index', 0)

    print(f"默认数据: platform={platform}, plat_index={plat_index}")
    if not platform:
        return jsonify({"code": 400, "msg": "参数错误：缺少平台参数", "data": []})

    try:
        # 每次切换平台界面时清空图片
        clear_image_dir(IMAGE_DIR)
        time.sleep(0.1)

        if plat_index == 0:
            result = to_dict(old_man_default(platform, 2))
        elif plat_index == 1:
            result = to_dict(hai_luo_default(platform, 2))
        elif plat_index == 2:
            result = to_dict(huo_qiang_shou_default(platform, 2, IMAGE_DIR))
        else:
            return jsonify({"code": 400, "msg": "plat_index参数错误", "data": []})

        if plat_index == 2:
            def process_images(items, plat_num):
                res = []
                for it in items:
                    url = it.get("img_url", "")
                    local_url = download_image(
                        IMAGE_DIR, url, "default", plat_num) if url else ""
                    res.append({
                        **it,
                        "img_url": local_url if local_url else "https://picsum.photos/44/44?gray"
                    })
                return res
            result = process_images(result, 3)

        return jsonify({
            "code": 200,
            "msg": "获取默认数据成功",
            "data": result
        })
    except Exception as e:
        print(f"默认数据异常: {e}")
        return jsonify({"code": 500, "msg": str(e), "data": []})


@app.route('/api/detail', methods=['POST'])
def get_game_detail():
    """获取游戏详细信息"""
    data = request.get_json()
    game_id = data.get('game_id', '')
    platform = data.get('platform', '').strip()
    plat_name = data.get('plat_name', '')
    img_url = data.get('img_url', '')  # 火枪手平台的本地下载图片路径

    print(
        f"详情: game_id={game_id}, platform={platform}, plat_name={plat_name}, img_url={img_url}")
    if not game_id or not plat_name:
        return jsonify({"code": 400, "msg": "参数错误", "data": None})

    try:
        if plat_name == '老猎人电玩':
            result = old_man_detail(game_id)
        elif plat_name == '海螺电玩':
            result = hai_luo_detail(game_id)
        elif plat_name == '火枪手电玩':
            result = huo_qiang_shou_detail(game_id, img_url)
        else:
            return jsonify({"code": 400, "msg": "平台名称错误", "data": None})

        if result:
            return jsonify({
                "code": 200,
                "msg": "获取详情成功",
                "data": result
            })
        else:
            return jsonify({"code": 404, "msg": "未找到游戏详情", "data": None})
    except Exception as e:
        print(f"详情异常: {e}")
        return jsonify({"code": 500, "msg": str(e), "data": None})


if __name__ == '__main__':
    app.run(debug=True)
