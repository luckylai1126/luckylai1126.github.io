# generate song_list.json
import os
import json

# get all directory names
def get_dirs(path):
    dirs = []
    for name in os.listdir(path):
        if os.path.isdir(os.path.join(path, name)):
            dirs.append(name)
    return dirs

# main
def main():
    routes = get_dirs(".")
    output_json = {
        "routes": routes
    }
    with open("song_list.json", "w") as f:
        json.dump(output_json, f, indent=4)

if __name__ == "__main__":
    main()