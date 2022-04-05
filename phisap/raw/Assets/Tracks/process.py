import os
import json

song_dirs = []
for dir in os.listdir('.'):
    if os.path.isdir(dir):
        song_dirs.append(dir)

def process_song(path):
    if(path.count('.') < 2):
        return
    meta = {
        "name": path.split('.')[0],
        "codename": path,
        "artist": path.split('.')[1],
        "musicFile":"music.wav",
        "chartEZ":"Chart_EZ.json",
        "chartHD":"Chart_HD.json",
        "chartIN":"Chart_IN.json",
        "chartAT":"Chart_AT.json",
        "ezRanking":"unranked",
        "hdRanking":"unranked",
        "inRanking":"unranked",
        "atRanking":"unranked",
        "illustration":"illustration.png",
        "chartDesigner":"phigros official",
        "illustrator":"phigros official",
        "sliceAudioStart":0
    }
    with open(os.path.join(path, 'meta.json'), 'w') as f:
        json.dump(meta, f)

if __name__ == '__main__':
    for dir in song_dirs:
        process_song(dir)
        print(f'Processed {dir}')