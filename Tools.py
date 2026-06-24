def to_dict(data):
    # 定义字段名
    keys = ['img_url', 'game_id', 'name', 'desc', 'price',  'platform']
    # 转换为字典列表
    dict_list = [dict(zip(keys, item)) for item in data]
    return dict_list
