import requests
import time
import os


def clear_huoqiangshou_images(IMAGE_DIR):
    """清除火枪手平台的本地图片缓存"""
    if os.path.exists(IMAGE_DIR):
        for f in os.listdir(IMAGE_DIR):
            if f.startswith("default_3_"):  # 只清除火枪手的默认数据图片
                try:
                    os.remove(os.path.join(IMAGE_DIR, f))
                except:
                    pass


def old_man_default(card_type, uppage=2):
    """老猎人电玩 - 获取默认数据（keyword为空）"""
    card_list = []
    url = "https://api.laolieren.com/v2/game/home"
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090a13) UnifiedPCWindowsWechat(0xf254151e) XWEB/17071",
        "Referer": "https://servicewechat.com/wxa50e5fd9fc4f0b66/180/page-frame.html",
        "Accept-Language": "zh-CN,zh;q=0.9"
    }

    if card_type == 'NS':
        card_type = 'switch'
    elif card_type == 'PS4':
        card_type = 'ps4'
    elif card_type == 'PS5':
        card_type = 'ps5'
    elif card_type == 'NS2':
        card_type = 'ns2'

    auth = {
        "id": "274007",
        "token": "18c848de7f244d430ec316673aed5610"
    }

    for page in range(1, uppage):
        post_data = {
            "auth": auth,
            "page": str(page),
            "app": "weixin",
            "filter": {
                "platform": card_type,
                "keyword": "",
                "listorder": "",
                "favorite": "",
                "genres": "",
                "preset": ""
            }
        }
        try:
            response = requests.post(
                url=url,
                json=post_data,
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            if data.get('rows') and data['rows'] != []:
                data_list = data['rows']
                for item in data_list:
                    # 获取价格：优先取二手价格，没有则取全新价格
                    price = item.get('price', '0')
                    skus = item.get('skus', [])
                    if skus:
                        # 优先取二手价格
                        second_hand = [
                            s for s in skus if s.get('is_new') == '0']
                        if second_hand:
                            price = second_hand[0].get('price', price)
                        else:
                            price = skus[0].get('price', price)

                    card = [
                        item.get('cover', ''),
                        item.get('id', ''),
                        item.get('title', ''),
                        item.get('genres', ''),
                        price,
                        '老猎人电玩'
                    ]
                    card_list.append(card)
                time.sleep(0.5)
            else:
                break
        except Exception as e:
            print(f"老猎人默认数据请求异常：{e}")
            break

    time.sleep(0.1)
    return card_list


def hai_luo_default(card_type, uppage=2):
    """海螺电玩 - 获取默认数据（keyword为空）"""
    if card_type == "NS":
        ask_type = 1
    elif card_type == "PS4":
        ask_type = 2
    elif card_type == "PS5":
        ask_type = 3
    elif card_type == "NS2":
        ask_type = 41

    base_url = "https://hailuo.dwzjd.com/api/products"
    card_list = []

    for page in range(1, uppage):
        params = {
            "cid": str(ask_type),
            "sid": 0,
            "keyword": "",
            "priceOrder": "",
            "salesOrder": "desc",
            "news": 0,
            "best": 0,
            "store_label_id": "",
            "page": str(page),
            "limit": 20
        }
        try:
            headers = {
                "Cb-lang": "zh-CN",
                "appId": "wx7f7b845076caaf81",
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090a13) UnifiedPCWindowsWechat(0xf2541b16) XWEB/20005",
                "Referer": "https://servicewechat.com/wx7f7b845076caaf81/78/page-frame.html"
            }
            response = requests.get(
                base_url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            data = response.json()
            if data.get('data') and data['data'] != []:
                data_list = data['data']
                for item in data_list:
                    label_list = ''
                    for label in item.get('label_list', []):
                        label_list = label_list + label.get('name', '') + ','
                    if label_list.endswith(','):
                        label_list = label_list[:-1]

                    card = [
                        item.get('image', item.get('cover', '')),
                        item.get('id', ''),
                        item.get('store_name', ''),
                        label_list,
                        item.get('price', '0'),
                        '海螺电玩'
                    ]
                    card_list.append(card)
                time.sleep(0.5)
            else:
                break
        except Exception as e:
            print(f"海螺默认数据请求异常：{e}")
            break

    time.sleep(0.1)
    return card_list


def huo_qiang_shou_default(card_type, uppage=2, image_dir="./static/images"):
    """火枪手电玩 - 获取默认数据（productName为空）"""
    # 每次切换平台时清除火枪手本地图片缓存
    clear_huoqiangshou_images(image_dir)

    if card_type == "NS":
        ask_type = 1
    elif card_type == "PS4":
        ask_type = 2
    elif card_type == "PS5":
        ask_type = 214
    elif card_type == "NS2":
        ask_type = 260

    base_url = "https://api.huoqiangshou.cn/seller/category/getProductInfoPage"
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "terminal": "WECHAT",
    }
    card_list = []

    for page in range(1, uppage):
        params = {
            "pageNumber": str(page),
            "pageSize": "10",
            "startPrice": "0",
            "endPrice": "10000",
            "news": 0,
            "brandId": str(ask_type),
            "productType": "CARD",
            "productName": "",
            "timeSort": "",
            "stockNum": "",
            "screenPrice": "",
            "linkStatus": "",
            "gameMode": "",
            "gameType": ""
        }
        try:
            response = requests.post(
                url=base_url,
                data=params,
                headers=headers,
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            if data.get('data') and data['data'].get('rows') and data['data']['rows'] != []:
                data_list = data['data']['rows']
                for item in data_list:
                    img_url = item.get('productMainUrl', '')
                    if img_url and not img_url.lower().endswith(('.png', '.jpg')):
                        img_url = img_url + ".jpg"

                    name = item.get('productName', '')
                    if card_type == 'NS':
                        name = card_type + " " + name

                    card = [
                        img_url,
                        item.get('id', ''),
                        name,
                        item.get('categoryName', ''),
                        item.get('retailPrice', '0'),
                        '火枪手电玩'
                    ]
                    card_list.append(card)
                time.sleep(0.5)
            else:
                break
        except Exception as e:
            print(f"火枪手默认数据请求异常：{e}")
            break

    time.sleep(0.1)
    return card_list
