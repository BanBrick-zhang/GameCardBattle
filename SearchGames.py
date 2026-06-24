import requests
import time


def hai_luo(card_type, game_name, uppage):
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
            "keyword": str(game_name),
            "priceOrder": "",
            "salesOrder": "desc",
            "news": 0,
            "page": str(page),
            "limit": 20,
            "coupon_category_id": "",
            "productId": ""
        }
        try:
            response = requests.get(base_url, params=params, timeout=10)
            response.raise_for_status()  # 若状态码非200，抛出HTTPError异常
            data = response.json()
            if data['data'] != []:
                data_list = data['data']
                for data in data_list:
                    label_list = ''
                    for label in data['label_list']:
                        label_list = label_list + label['name'] + ','
                    if label_list.endswith(','):
                        label_list = label_list[:-1]
                    card = [data['image'], data['id'], data['store_name'], label_list,
                            data['price'], '海螺电玩']
                    card_list.append(card)
                time.sleep(1)
            else:
                break

        except requests.exceptions.HTTPError as e:
            print(f"HTTP请求错误：{e}，状态码：{response.status_code}")
        except requests.exceptions.ConnectionError:
            print("网络连接错误，请检查网络或URL是否正确")
        except requests.exceptions.Timeout:
            print("请求超时，请重试")
        except requests.exceptions.RequestException as e:
            print(f"请求异常：{e}")
        except ValueError:
            print("返回数据不是有效的JSON格式")
    time.sleep(0.1)
    return card_list


def old_man(card_type, game_name, uppage):
    card_list = []
    url = "https://api.laolieren.com/v2/game/home"
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090a13) UnifiedPCWindowsWechat(0xf254151e) XWEB/17071",
        "Content-Length": "129",
        "Referer": "https://servicewechat.com/wxa50e5fd9fc4f0b66/180/page-frame.html",
        "Accept-Language": "Accept-Language"
    }
    if card_type == 'NS':
        card_type = 'switch'
    elif card_type == 'PS4':
        card_type = 'ps4'
    elif card_type == 'PS5':
        card_type = 'ps5'
    elif card_type == 'NS2':
        card_type = 'ns2'
    for page in range(1, uppage):
        post_data = {
            "auth": "",
            "page": str(page),
            "app": "weixin",
            "filter": {
                "platform": card_type,
                "keyword": str(game_name),
                "listorder": "metacritic_desc",
                # "metacritic_desc"
                "favorite": "",
                "genres": "",
                "preset": ""}
        }
        try:
            response = requests.post(
                url=url,
                json=post_data,  # 自动将字典转为JSON字符串
                headers=headers,
                timeout=10  # 设置超时时间，避免无限等待
            )
            response.raise_for_status()  # 若状态码非200，抛出HTTPError异常
            data = response.json()
            if data['rows'] != []:
                data_list = data['rows']
                for data in data_list:
                    card = [data['cover'], data['id'], data['title'], data['genres'],
                            data['price'], '老猎人电玩']
                    card_list.append(card)
                time.sleep(1)
            else:
                break

        except requests.exceptions.HTTPError as e:
            print(f"HTTP请求错误：{e}，状态码：{response.status_code}")
        except requests.exceptions.ConnectionError:
            print("网络连接错误，请检查网络或URL是否正确")
        except requests.exceptions.Timeout:
            print("请求超时，请重试")
        except requests.exceptions.RequestException as e:
            print(f"请求异常：{e}")
        except ValueError:
            print("返回数据不是有效的JSON格式")
    time.sleep(0.1)
    return card_list


def huo_qiang_shou(card_type, game_name, uppage):
    if card_type == "NS":
        ask_type = 1
    elif card_type == "PS4":
        ask_type = 2
    elif card_type == "PS5":
        ask_type = 214
    elif card_type == "NS2":
        ask_type = 260
    card_list = []
    base_url = "https://api.huoqiangshou.cn/seller/category/getProductInfoPage"
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "terminal": "WECHAT",
    }
    card_list = []
    for page in range(1, uppage):
        params = {
            # "Referer": "https://servicewechat.com/wx0f883cb942dd9691/626/page-frame.html",
            "timeSort": "",
            "pageSize": "10",
            "startPrice": "0",
            "endPrice": "10000",
            "news": 0,
            "pageNumber": str(page),
            "limit": 20,
            "brandId": str(ask_type),
            "productType": "CARD",
            "productName": str(game_name)
        }
        try:
            # response = requests.get(base_url, params=params, timeout=10)
            response = requests.post(
                url=base_url,
                data=params,  # 自动将字典转为JSON字符串
                headers=headers,
                timeout=10  # 设置超时时间，避免无限等待
            )
            # print(response)
            response.raise_for_status()  # 若状态码非200，抛出HTTPError异常
            data = response.json()
            if data['data']['rows'] != []:
                data_list = data['data']['rows']
                for data in data_list:
                    if card_type == 'NS':
                        if data['productMainUrl'].lower().endswith(('.png', '.jpg')):
                            card = [data['productMainUrl'], data['id'], card_type + " " + data['productName'], data['categoryName'],
                                    data['retailPrice'], '火枪手电玩']
                        else:
                            card = [data['productMainUrl'] + ".jpg", data['id'], card_type + " " + data['productName'], data['categoryName'],
                                    data['retailPrice'], '火枪手电玩']
                    else:
                        if data['productMainUrl'].lower().endswith(('.png', '.jpg')):
                            card = [data['productMainUrl'], data['id'], data['productName'], data['categoryName'],
                                    data['retailPrice'], '火枪手电玩']
                        else:
                            card = [data['productMainUrl'] + ".jpg", data['id'], data['productName'], data['categoryName'],
                                    data['retailPrice'], '火枪手电玩']
                    card_list.append(card)
                time.sleep(1)
            else:
                break

        except requests.exceptions.HTTPError as e:
            print(f"HTTP请求错误：{e}，状态码：{response.status_code}")
        except requests.exceptions.ConnectionError:
            print("网络连接错误，请检查网络或URL是否正确")
        except requests.exceptions.Timeout:
            print("请求超时，请重试")
        except requests.exceptions.RequestException as e:
            print(f"请求异常：{e}")
        except ValueError:
            print("返回数据不是有效的JSON格式")
    time.sleep(0.1)
    return card_list
