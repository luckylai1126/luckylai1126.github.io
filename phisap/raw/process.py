import os
import json
import shutil

def get_dir_to_file():
    reflect_map = {}
    for dir in os.listdir('.'):
        if os.path.isdir(dir):
            sub_dir_path = os.listdir(dir)[0]
            if os.path.isdir(os.path.join(dir, sub_dir_path)):
                object0 = ""
                for file in os.listdir(os.path.join(dir, sub_dir_path)):
                    if "#" not in file:
                        object0 = file
                reflect_map[dir.split('.')[0]] = os.path.join(dir, sub_dir_path, object0)
    return reflect_map

def load_cata_json(file_path):
    with open(file_path, 'r') as f:
        return json.load(f)

def check_dir_exist(dir_path):
    if not os.path.exists(dir_path):
        os.makedirs(dir_path)

def write_file_safe(file_path, content):
    check_dir_exist(os.path.dirname(file_path))
    with open(file_path, 'wb') as f:
        f.write(content)

def read_file_safe(file_path):
    with open(file_path, 'rb') as f:
        return f.read()

def remove_dir_with_file(path):
    shutil.rmtree(path)

if __name__ == "__main__":
    reflect_map = get_dir_to_file()
    catalog = load_cata_json('catalog.json')
    for key0 in reflect_map:
        key = key0 + '.bundle'
        if(catalog.get(key)):
            content = read_file_safe(reflect_map[key0])
            write_file_safe(catalog[key], content)
            print("{} -> {}".format(key, catalog[key]))
            remove_dir_with_file(key0+'.bundle_exports')
    
                
    


