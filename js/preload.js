const chart_difficulty_short_names = ['EZ', 'HD', 'IN', 'AT'];
const chart_difficulty_ranking_keys = ['ezRanking', 'hdRanking', 'inRanking', 'atRanking'];
const chart_difficulty_keys = ['chartEZ', 'chartHD', 'chartIN', 'chartAT'];
const chart_desinger_keys = ['ezChartDesigner', 'hdChartDesigner', 'inChartDesigner', 'atChartDesigner'];

function uri2json() {
    var uri = window.location.search.substring(1);
    var params = uri.split("&");
    var result = {};
    for (var i = 0; i < params.length; i++) {
        var param = params[i].split("=");
        result[param[0]] = param[1];
    }
    return result;
}

function get_meta(route) {
    meta = {}
    $.ajax({
        url: `./charts/${route}/meta.json`,
        async: false,
        dataType: 'json',
        success: function(data) {
            meta = data
        }
    })
    return meta
}


function load_chart(route, chart_name) {
    data = undefined
    $.ajax({
        url: `./charts/${route}/${chart_name}`,
        async: false,
        success: function(data) {
            ext = chart_name.split('.').pop()
            if (ext == 'pec') {
                data = ConvertPEC2Json(data, chart_name)

            }
            data = ConvertChartVersion(data)
            data = CalculateChartData(data)
            chart0.data = data
        }
    })
}

function load_audio(route, audio) {
    let audio_data = PIXI.sound.Sound.from({
        url: `./charts/${route}/${audio}`,
        preload: true,
    })
    chart0.audio = audio_data
}

function load_image(route, image) {
    return new Promise(function(resolve, _) {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', `./charts/${route}/${image}`, true);
        xhr.responseType = 'blob';
        xhr.onload = function(e) {
            if (this.status == 200) {
                let myBlob = this.response;
                let reader = new FileReader();
                reader.readAsDataURL(myBlob);
                reader.onloadend = function() {
                    let base64data = reader.result;
                    let colorThief = new ColorThief();
                    console.log(base64data)
                    PIXI.Texture.fromURL(base64data).then((texture) => {
                        let blur = PIXI.Texture.from(BlurImage(texture.baseTexture, 20));
                        for (let color of colorThief.getPalette(texture.baseTexture.resource.source, 10)) {
                            if (color[0] * 0.299 + color[1] * 0.587 + color[2] * 0.114 < 192) {
                                textures.baseColor = blur.baseColor = Number('0x' + color[0].toString(16) + color[1].toString(16) + color[2].toString(16));
                                break;
                            }
                        }
                        if (!texture.baseColor) {
                            texture.baseColor = colorThief.getColor(texture.baseTexture.resource.source);
                            texture.baseColor = blur.baseColor = Number('0x' + texture.baseColor[0].toString(16) + texture.baseColor[1].toString(16) + texture.baseColor[2].toString(16));
                        }
                        chart0.image = texture
                        chart0.imageBlur = blur
                        resolve()
                    })
                }
            }
        }
        xhr.send();
    })
}



window.onload = function() {
    chart0 = {}
    param = uri2json()
    meta = get_meta(param.route);
    if (meta == undefined || param.diff == undefined) {
        window.location = './select.html'
    }
    level = meta[chart_difficulty_ranking_keys[param.diff]];
    ranking = chart_difficulty_short_names[param.diff];
    chart_name = meta[chart_difficulty_keys[param.diff]];
    designer = meta[chart_desinger_keys[param.diff]];
    audio = meta.musicFile;
    illustration = meta.illustration
    chart0.info = {
        name: meta.name,
        level: ranking,
        illustrator: meta.illustrator,
        designer: designer,
    }
    load_chart(param.route, chart_name)
    load_audio(param.route, audio)
    load_image(param.route, illustration).then(() => {
        window._chart = chart0

        function wait() {
            if (!chart0.audio.isLoaded) {
                setTimeout(wait, 100)
            } else {
                gameInit()
                setCanvasFullscreen(true)
            }
        }
        wait()
    })


}