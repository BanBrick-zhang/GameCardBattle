import requests
import time
import re


def _extract_platform_from_name(name):
    """从游戏名称中提取平台信息"""
    if not name:
        return "NS"
    name_upper = name.upper()
    if name_upper.startswith("NS2 ") or name_upper.startswith("NS2"):
        return "NS2"
    elif name_upper.startswith("PS5 ") or name_upper.startswith("PS5"):
        return "PS5"
    elif name_upper.startswith("PS4 ") or name_upper.startswith("PS4"):
        return "PS4"
    elif name_upper.startswith("NS ") or name_upper.startswith("NS"):
        return "NS"
    return "NS"


def _clean_html_description(html_content):
    """清理HTML标签，保留纯文本"""
    if not html_content:
        return ""
    text = html_content.replace('<br>', '\n').replace(
        '<br/>', '\n').replace('<br />', '\n')
    text = text.replace('</p>', '\n').replace('</div>', '\n')
    text = re.sub(r'<[^>]+>', '', text)
    text = text.replace('&nbsp;', ' ').replace(
        '&quot;', '"').replace('&amp;', '&')
    text = text.replace('&lt;', '<').replace('&gt;', '>').replace('&#39;', "'")
    text = '\n'.join(line.strip() for line in text.split('\n') if line.strip())
    return text


def old_man_detail(game_id):
    """老猎人电玩 - 获取游戏详细信息"""
    url = "https://api.laolieren.com/v2/game/detail"
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090a13) UnifiedPCWindowsWechat(0xf254151e) XWEB/17071",
        "Referer": "https://servicewechat.com/wxa50e5fd9fc4f0b66/184/page-frame.html",
        "Accept-Language": "zh-CN,zh;q=0.9"
    }

    auth = {
        "id": "274007",
        "token": "18c848de7f244d430ec316673aed5610"
    }

    post_data = {
        "auth": auth,
        "id": str(game_id)
    }

    try:
        response = requests.post(
            url, json=post_data, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data.get('status') == 1 and data.get('row'):
            row = data['row']
            skus = data.get('skus', [])
            prices = data.get('prices', [])

            current_price = row.get('price', '0')
            if skus:
                second_hand = [s for s in skus if s.get('is_new') == '0']
                if second_hand:
                    current_price = second_hand[0].get('price', current_price)

            history_prices = []
            for p in prices:
                history_prices.append({
                    "date": p.get('ymd', ''),
                    "price": float(p.get('price', 0))
                })

            album = row.get('album', [])
            if row.get('cover') and row['cover'] not in album:
                album.insert(0, row['cover'])

            platform_map = {
                'switch': 'NS',
                'ns2': 'NS2',
                'ps4': 'PS4',
                'ps5': 'PS5'
            }
            platform = platform_map.get(row.get('platform', ''), 'NS')

            return {
                "platform": platform,
                "game_id": game_id,
                "name": row.get('title', ''),
                "price": current_price,
                "cover": row.get('cover', ''),
                "genres": row.get('genres', ''),
                "language": row.get('language', ''),
                "description": row.get('content', ''),
                "album": album,
                "history_prices": history_prices,
                "skus": skus,
                "fashou_date": row.get('fashou_date', ''),
                "metacritic": row.get('metacritic', ''),
                "presale_date": row.get('presale_date', '')
            }
        return None
    except Exception as e:
        print(f"老猎人详情请求异常：{e}")
        return None


def hai_luo_detail(product_id):
    """海螺电玩 - 获取游戏详细信息（统一为老猎人格式）"""
    base_url = f"https://hailuo.dwzjd.com/api/product/detail/{product_id}"

    headers = {
        "Cb-lang": "zh-CN",
        "appId": "wx7f7b845076caaf81",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090a13) UnifiedPCWindowsWechat(0xf2541b16) XWEB/20005",
        "Referer": "https://servicewechat.com/wx7f7b845076caaf81/78/page-frame.html"
    }

    try:
        response = requests.get(base_url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data.get('status') == 200 and data.get('data'):
            d = data['data']
            store_info = d.get('storeInfo', {})

            history_prices = []
            for hp in d.get('history_price', []):
                history_prices.append({
                    "date": hp.get('date', ''),
                    "price": float(hp.get('value', 0))
                })

            labels = []
            for label in store_info.get('label_list', []):
                labels.append(label.get('name', ''))
            genres = ', '.join(labels)

            album = store_info.get('slider_image', [])
            if store_info.get('cover') and store_info['cover'] not in album:
                album.insert(0, store_info['cover'])

            skus = []
            for sku_key, sku_val in d.get('productValue', {}).items():
                is_recycle = sku_val.get('is_recycle', 0)
                is_new = '0' if is_recycle == 1 else '1'
                skus.append({
                    "id": str(sku_val.get('id', '')),
                    "title": sku_val.get('suk', ''),
                    "price": str(sku_val.get('price', '0')),
                    "is_new": is_new,
                    "quantity": str(sku_val.get('stock', 0))
                })

            fashou_date = ''
            for param in store_info.get('params_list', []):
                if param.get('name') == '发售时间':
                    fashou_date = param.get('value', '')
                    break

            platform = _extract_platform_from_name(
                store_info.get('store_name', ''))

            description = store_info.get('store_info', '')
            if not description:
                description = store_info.get('description', '')

            return {
                "platform": platform,
                "game_id": product_id,
                "name": store_info.get('store_name', ''),
                "price": str(store_info.get('price', '0')),
                "cover": store_info.get('cover', ''),
                "genres": genres,
                "language": store_info.get('language', ''),
                "description": description,
                "album": album,
                "history_prices": history_prices,
                "skus": skus,
                "fashou_date": fashou_date,
                "metacritic": '',
                "presale_date": ''
            }
        return None
    except Exception as e:
        print(f"海螺详情请求异常：{e}")
        return None


def huo_qiang_shou_detail(product_id, local_img_url=''):
    """火枪手电玩 - 获取游戏详细信息（统一为老猎人格式）"""
    base_url = "https://api.huoqiangshou.cn/seller/sellerProduct/getProductDetail"
    history_url = "https://api.huoqiangshou.cn/seller/sellerProduct/getProductPriceHistory"

    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "terminal": "WECHAT",
    }

    try:
        detail_params = {
            "productId": str(product_id),
            "lottoProduct": "false"
        }
        response = requests.post(
            base_url, data=detail_params, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data.get('code') == 200 and data.get('data'):
            d = data['data']

            history_prices = []
            try:
                history_params = {"productId": str(product_id)}
                hist_resp = requests.post(
                    history_url, data=history_params, headers=headers, timeout=10)
                hist_resp.raise_for_status()
                hist_data = hist_resp.json()
                if hist_data.get('data'):
                    for hp in hist_data['data']:
                        history_prices.append({
                            "date": hp.get('recordDate', ''),
                            "price": float(hp.get('price', 0))
                        })
            except Exception as e:
                print(f"火枪手历史价格请求异常：{e}")

            album = []
            if d.get('productDetailUrl'):
                album = [url.strip()
                         for url in d['productDetailUrl'].split(',') if url.strip()]

            # 使用本地图片作为封面，如果提供了的话
            cover = local_img_url if local_img_url else d.get(
                'productMainUrl', '')
            if d.get('productMainUrl') and d['productMainUrl'] not in album:
                album.insert(0, d['productMainUrl'])

            platform = _extract_platform_from_name(d.get('productName', ''))

            skus = [{
                "id": str(product_id),
                "title": "二手",
                "price": str(d.get('retailPrice', '0')),
                "is_new": "0",
                "quantity": ""
            }]

            return {
                "platform": platform,
                "game_id": product_id,
                "name": d.get('productName', ''),
                "price": str(d.get('retailPrice', '0')),
                "cover": cover,
                "genres": d.get('categoryName', ''),
                "language": d.get('productTip', ''),
                "description": d.get('gameIntroduction', ''),
                "album": album,
                "history_prices": history_prices,
                "skus": skus,
                "fashou_date": d.get('launchTime', ''),
                "metacritic": '',
                "presale_date": ''
            }
        return None
    except Exception as e:
        print(f"火枪手详情请求异常：{e}")
        return None
