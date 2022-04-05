const chart_difficulty_keys = ['chartEZ', 'chartHD', 'chartIN', 'chartAT'];
const chart_difficulty_ranking_keys = ['ezRanking', 'hdRanking', 'inRanking', 'atRanking'];
const chart_difficulty_short_names = ['EZ', 'HD', 'IN', 'AT'];
const chart_diificulty_count = 4;

function produce_mdui_card(imageUrl, title, subtitle, actions) {
    return `<div class="mdui-col-xs-3">
    <div class="mdui-card">
        <div class="mdui-card-media">
            <img src="${imageUrl}" />
        </div>
        <div class="mdui-card-primary">
            <div class="mdui-card-primary-title">${title}</div>
            <div class="mdui-card-primary-subtitle">${subtitle}</div>
        </div>
        <div class="mdui-card-actions">
            ${actions}
        </div>
        </div>`;
}

function produce_mdui_card_actions(rankings) {
    result = ''
    rankings.forEach(element => {
        result += `<a class="mdui-btn mdui-ripple" href="./index.html?${element.url}">${element.description}</a>`
    });
    return result;
}

function get_meta(url) {
    var meta = {};
    $.ajax({
        url: url,
        dataType: 'json',
        async: false,
        success: function(data) {
            meta = data;
        }
    })
    return meta;
}

function json2uri(json) {
    return Object.keys(json).map(function(key) {
        return [key, json[key]].map(encodeURIComponent).join("=");
    }).join("&");
}

function display_songs(routes) {
    routes.forEach(element => {
        meta = get_meta(`./charts/${element}/meta.json`);
        illustration = meta.illustration;
        illustration_url = `./charts/${element}/${illustration}`;
        title = meta.name;
        subtitle = meta.artist;
        // get difficulty and ranking
        // if ranking equals 0, then it's not ranked
        // or undefined, then it's not ranked
        rankings = [];
        for (var i = 0; i < chart_diificulty_count; i++) {
            key = chart_difficulty_keys[i];
            ranking_key = chart_difficulty_ranking_keys[i];
            ranking = meta[ranking_key];
            short_name = chart_difficulty_short_names[i];
            if (ranking == 0 || ranking == undefined) {
                // do nothing
            } else {
                rankings.push({
                    description: `${short_name} ${ranking}`,
                    url: json2uri({
                        "route": element,
                        "diff": i
                    })
                });
            }
        }
        actions = produce_mdui_card_actions(rankings);
        card = produce_mdui_card(illustration_url, title, subtitle, actions);
        $('#song-list').append(card);
    });
}

window.onload = function() {
    song_list_url = './charts/song_list.json';
    song_list_json = null;
    song_list_json_loaded = false;
    $.ajax({
        url: song_list_url,
        dataType: 'json',
        async: false,
        success: function(data) {
            song_list_json = data;
            song_list_json_loaded = true;
            routes = data.routes
            display_songs(routes);
        }
    })
}