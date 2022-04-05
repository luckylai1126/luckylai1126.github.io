'use strict';

var pixi = null; // 备用
var Loader = new PIXI.Loader(); // Pixi.js 自带的资源加载器

// 精灵和贴图信息
var sprites = {};
var textures = {
    judgeIcon: {},
    sound: {
        levelOver: {}
    }
};

// 谱面信息
var _chart = {}; // 被选中的谱面信息
var chartData = {
    images: undefined,
    imagesBlur: undefined,
    audios: undefined,
    charts: undefined,
    infos: undefined,
    lines: undefined
};

// 用户输入信息
var inputs = {
    taps: [],
    touches: {},
    mouse: {},
    isMouseDown: {},
    keyboard: {}
};

var stat = {
    isRetrying: false,
    isTransitionEnd: false,
    isPaused: false,
    isFullscreen: false
};

var judgements = new Judgements();
const judgementTimes = {
    bad: 200,
    good: 160,
    perfect: 80,
    badChallenge: 100,
    goodChallenge: 75,
    perfectChallenge: 40
};


// ========此处声明监听器=========
// ==Pixijs Loader 事件监听器==
// 监听图像加载进度


// ==正常 DOM 元素事件监听器==
// 监听侧边抽屉式导航栏项目被按下事件

// ========此处为所有的初始化代码========
// 注册所有的 Pixi.js 插件
PIXI.CanvasRenderer.registerPlugin('graphics', PIXI.CanvasGraphicsRenderer);
PIXI.CanvasRenderer.registerPlugin('sprite', PIXI.CanvasSpriteRenderer);

// 加载图像和声音资源
Loader.add([
        { name: 'tap', url: './img/Tap.png' },
        { name: 'tap2', url: './img/Tap2.png' },
        { name: 'tapHl', url: './img/TapHL.png' },
        { name: 'drag', url: './img/Drag.png' },
        { name: 'dragHl', url: './img/DragHL.png' },
        { name: 'flick', url: './img/Flick.png' },
        { name: 'flickHl', url: './img/FlickHL.png' },
        { name: 'holdHead', url: './img/HoldHead.png' },
        { name: 'holdHeadHl', url: './img/HoldHeadHL.png' },
        { name: 'holdBody', url: './img/Hold.png' },
        { name: 'holdBodyHl', url: './img/HoldHL.png' },
        { name: 'holdEnd', url: './img/HoldEnd.png' },
        { name: 'holdEndHl', url: './img/HoldEndHL.png' },
        { name: 'judgeLine', url: './img/JudgeLine.png' },
        { name: 'clickRaw', url: './img/clickRaw128.png' },

        { name: 'songNameBar', url: './img/SongsNameBar.png' },
        { name: 'progressBar', url: './img/ProgressBar.png' },

        { name: 'judgeIconFalse', url: './img/judgeIcons/false.png' },
        { name: 'judgeIconC', url: './img/judgeIcons/c.png' },
        { name: 'judgeIconB', url: './img/judgeIcons/b.png' },
        { name: 'judgeIconA', url: './img/judgeIcons/a.png' },
        { name: 'judgeIconS', url: './img/judgeIcons/s.png' },
        { name: 'judgeIconV', url: './img/judgeIcons/v.png' },
        { name: 'judgeIconPhi', url: './img/judgeIcons/phi.png' },

        { name: 'soundTap', url: './sound/Hitsound-Tap.ogg' },
        { name: 'soundDrag', url: './sound/Hitsound-Drag.ogg' },
        { name: 'soundFlick', url: './sound/Hitsound-Flick.ogg' },

        { name: 'levelOverEZ', url: './sound/levelOver/ez.ogg' },
        { name: 'levelOverHD', url: './sound/levelOver/hd.ogg' },
        { name: 'levelOverIN', url: './sound/levelOver/in.ogg' },
        { name: 'levelOverAT', url: './sound/levelOver/at.ogg' },
        { name: 'levelOverSP', url: './sound/levelOver/sp.ogg' }
    ])
    .load(function(event) {
        // 将贴图信息添加到 textures 对象中
        for (const name in event.resources) {
            if (name.indexOf('sound') <= -1 && name.indexOf('judgeIcon') <= -1 && name.indexOf('levelOver') <= -1) {
                textures[name] = event.resources[name].texture;

                if (name == 'clickRaw') { // 将点击爆裂效果雪碧图转换为贴图数组，以方便创建动画精灵对象。
                    /***
                     * 根据 PIXI 对于动画组件的规定，我们需要将动画雪碧图拆分成 30 个同等大小的
                     * 图片，将它们按照顺序存放入材质数组，这样才可以用他来正常创建动画精灵。
                     * 至于为什么图片分辨率被我压缩到了 128px，是因为我的设备读不了原尺寸的图片...
                     * 如果修改了这里的材质图的分辨率，记得在 function.js 中的 CreateClickAnimation() 中修改缩放值！
                     ***/
                    let _clickTextures = [];

                    for (let i = 0; i < Math.floor(textures[name].height / textures[name].width); i++) {
                        let rectangle = new PIXI.Rectangle(0, i * textures[name].width, textures[name].width, textures[name].width);
                        let texture = new PIXI.Texture(textures[name].baseTexture, rectangle);

                        _clickTextures.push(texture);
                    }

                    textures[name] = _clickTextures;
                }
            } else if (name.indexOf('judgeIcon') >= 0) { // 把判定等级图标单独分入一个 Object
                textures.judgeIcon[name.replace('judgeIcon', '').toLowerCase()] = event.resources[name].texture;

            } else if (name.indexOf('sound') >= 0) { // 把声音资源过滤出来单独分进一个 Object
                textures.sound[name.replace('sound', '').toLowerCase()] = event.resources[name].sound;
                textures.sound[name.replace('sound', '').toLowerCase()].play({ volume: 0 });

            } else if (name.indexOf('levelOver') >= 0) { // 结算音乐单独分出来
                textures.sound.levelOver[name.replace('levelOver', '').toLowerCase()] = event.resources[name].sound;
                textures.sound.levelOver[name.replace('levelOver', '').toLowerCase()].loop = true;
            }
        }
    });


function switchChart(name) {
    let chartInfos = chartData.infos;

    if (!chartInfos) return;

    let chart = {};

    // 为了避免某些玄学问题才使用这样的写法
    try {
        for (let _chartInfo of chartInfos) {
            let chartInfo = JSON.parse(JSON.stringify(_chartInfo));

            let audioItems = document.getElementById('menu-chart-audio').getElementsByTagName('a');
            let imageItems = document.getElementById('menu-chart-image').getElementsByTagName('a');

            for (let keyName in chartInfo) {
                if (keyName.indexOf('Chart') >= 0 && chartInfo[keyName] == name) {
                    chart = {
                        info: {
                            name: chartInfo.Name,
                            level: chartInfo.Level,
                            illustrator: chartInfo.Illustrator,
                            designer: chartInfo.Designer
                        },
                        data: chartData.charts[name],
                        audio: chartData.audios[chartInfo.Music],
                        image: chartData.images[chartInfo.Image],
                        imageBlur: chartData.imagesBlur[chartInfo.Image],
                        lines: []
                    };

                    if (chartData.lines instanceof Array) {
                        for (let line of chartData.lines) {
                            if (line.Chart == chartInfo.Chart) {
                                chart.lines.push(line);
                            }
                        }
                    }

                    for (let audioItem of audioItems) {
                        if (audioItem.getAttribute('menu-value') == chartInfo.Music) {
                            selectMenuItem('menu-chart-audio', audioItem, 'list-text-chart-audio');
                            break;
                        }
                    }

                    for (let imageItem of imageItems) {
                        if (imageItem.getAttribute('menu-value') == chartInfo.Image) {
                            selectMenuItem('menu-chart-image', imageItem, 'list-text-chart-image');
                            break;
                        }
                    }

                    mdui.$('#input-chart-name').val(chartInfo.Name);
                    mdui.$('#input-chart-difficulty').val(chartInfo.Level);
                    mdui.$('#input-chart-author').val(chartInfo.Designer);
                    mdui.$('#input-chart-bg-author').val(chartInfo.Illustrator);

                    mdui.mutation('#panel-select-chart-info');

                    _chart = chart;

                    return;
                }
            }
        }

    } catch (e) { // 兼容没有 info.csv 文件的谱面包
        console.warn('该谱面包可能不自带谱面信息，您可能需要手动填写相关信息。', e);

        let firstImage = document.getElementById('menu-chart-image').getElementsByTagName('a')[0];
        let firstAudio = document.getElementById('menu-chart-audio').getElementsByTagName('a')[0];
        let firstImageName = firstImage.getAttribute('menu-value');
        let firstAudioName = firstAudio.getAttribute('menu-value');

        chart = {
            info: {
                name: null,
                level: null,
                illustrator: null,
                designer: null
            },
            data: chartData.charts[name],
            audio: chartData.audios[firstAudioName],
            image: chartData.images[firstImageName],
            imageBlur: chartData.imagesBlur[firstImageName],
            lines: []
        };

        if (chartData.lines instanceof Array) {
            for (let line of chartData.lines) {
                if (line.Chart == name) {
                    chart.lines.push(line);
                }
            }
        }

        selectMenuItem('menu-chart-audio', firstAudio, 'list-text-chart-audio');
        selectMenuItem('menu-chart-image', firstImage, 'list-text-chart-image');

        _chart = chart;
        return;
    }
}

// 初始化并启动模拟器
function gameInit() {
    let canvasBox = document.getElementById('game-canvas-box');

    if (!_chart.data) {
        mdui.alert('你还没有选择一个谱面，请选择一个谱面！', '前方高能', () => {});
        return;
    }

    if (!_chart.audio || !_chart.audio.isLoaded) {
        mdui.alert('谱面音频正在努力装载中，请稍等一会再试！<br>如果你持续收到该消息，请检查音频文件。', '前方高能');
        return;
    }

    if (pixi) {
        mdui.alert('模拟器已经启动啦！', '前方高能', () => {});
        return;
    }

    // 定义判定时间
    global.judgeTimes = {
        perfect: (settings.challengeMode ? judgementTimes.perfectChallenge : judgementTimes.perfect) / 1000,
        good: (settings.challengeMode ? judgementTimes.goodChallenge : judgementTimes.good) / 1000,
        bad: (settings.challengeMode ? judgementTimes.badChallenge : judgementTimes.bad) / 1000
    };

    // 初始化 Pixi 舞台
    pixi = new PIXI.Application({
        width: canvasBox.offsetWidth,
        height: canvasBox.offsetWidth * (1 / settings.windowRatio),
        antialias: settings.antiAlias,
        autoDensity: true,
        resolution: settings.resolution,
        forceCanvas: settings.forceCanvas
    });
    canvasBox.innerHTML = '';
    canvasBox.appendChild(pixi.view);

    pixi.renderer.realWidth = pixi.renderer.width / pixi.renderer.resolution;
    pixi.renderer.realHeight = pixi.renderer.height / pixi.renderer.resolution;

    pixi.renderer.fixedWidth = pixi.renderer.realWidth <= pixi.renderer.realHeight / 9 * 16 ? pixi.renderer.realWidth : pixi.renderer.realHeight / 9 * 16;
    pixi.renderer.fixedWidthPercent = pixi.renderer.fixedWidth / 18;
    pixi.renderer.fixedWidthOffset = (pixi.renderer.realWidth - pixi.renderer.fixedWidth) / 2;

    pixi.renderer.noteSpeed = pixi.renderer.realHeight * 0.6;
    pixi.renderer.noteScale = pixi.renderer.fixedWidth / settings.noteScale;

    pixi.renderer.lineScale = pixi.renderer.fixedWidth > pixi.renderer.realHeight * 0.75 ? pixi.renderer.realHeight / 18.75 : pixi.renderer.fixedWidth / 14.0625;

    pixi.stage.sortableChildren = true;

    // ========此处声明监听器=========
    // ==Passive 兼容性检测，代码来自 Mozilla==
    let passiveIfSupported = false;
    try {
        pixi.view.addEventListener('test', null, Object.defineProperty({}, 'passive', { get: function() { passiveIfSupported = { passive: false }; } }));
    } catch (err) {}

    // ==Windows 对象 事件监听器==
    // 监听窗口尺寸修改事件，以实时修改舞台宽高和材质缩放值
    window.addEventListener('resize', () => { global.functions.resizeCanvas(pixi) });

    // ==舞台用户输入事件监听器==
    // 舞台触摸开始事件
    pixi.view.addEventListener('touchstart', (e) => {
        e.preventDefault();

        for (let touch of e.changedTouches) {
            let fingerId = touch.identifier;
            let fixedPosition = getCurrentInputPosition(touch);

            inputs.touches[fingerId] = Click.activate(fixedPosition.x, fixedPosition.y, 'touches', fingerId);
        }
    }, passiveIfSupported); // 设置 passive 为 false 是为了能在回调函数中调用 preventDefault()，下同

    // 舞台触摸移动事件
    pixi.view.addEventListener('touchmove', (e) => {
        e.preventDefault();

        for (let touch of e.changedTouches) {
            let fingerId = touch.identifier;
            let fixedPosition = getCurrentInputPosition(touch);

            inputs.touches[fingerId].move(fixedPosition.x, fixedPosition.y);
        }
    }, passiveIfSupported);

    // 舞台触摸结束事件
    pixi.view.addEventListener('touchend', (e) => {
        e.preventDefault();

        for (let touch of e.changedTouches) {
            let fingerId = touch.identifier;

            delete inputs.touches[fingerId];
            if (settings.showFinger && sprites.inputs.touches[fingerId]) {
                sprites.inputs.touches[fingerId].visible = false;
            }
        }
    }, passiveIfSupported);
    pixi.view.addEventListener('touchcancel', (e) => {
        e.preventDefault();

        for (let touch of e.changedTouches) {
            let fingerId = touch.identifier;

            delete inputs.touches[fingerId];
            if (settings.showFinger && sprites.inputs.touches[fingerId]) {
                sprites.inputs.touches[fingerId].visible = false;
            }
        }
    }, passiveIfSupported);

    // 舞台鼠标开始事件
    pixi.view.addEventListener('mousedown', (e) => {
        e.preventDefault();

        let btnId = e.button;
        let fixedPosition = getCurrentInputPosition(e);

        inputs.mouse[btnId] = Click.activate(fixedPosition.x, fixedPosition.y, 'mouse', btnId);
        inputs.isMouseDown[btnId] = true;
    }, passiveIfSupported);

    // 舞台鼠标移动事件
    pixi.view.addEventListener('mousemove', (e) => {
        e.preventDefault();

        for (let btnId in inputs.isMouseDown) {
            if (inputs.isMouseDown[btnId]) {
                let fixedPosition = getCurrentInputPosition(e);

                inputs.mouse[btnId].move(fixedPosition.x, fixedPosition.y);
            }
        }
    }, passiveIfSupported);

    // 舞台鼠标结束事件
    pixi.view.addEventListener('mouseup', (e) => {
        e.preventDefault();

        let btnId = e.button;

        delete inputs.mouse[btnId];
        delete inputs.isMouseDown[btnId];

        if (settings.showFinger && sprites.inputs.mouse[btnId]) {
            sprites.inputs.mouse[btnId].visible = false;
        }
    }, passiveIfSupported);
    pixi.view.addEventListener('mouseout', (e) => {
        e.preventDefault();

        for (let btnId in inputs.mouse) {
            if (inputs.isMouseDown[btnId]) {
                delete inputs.mouse[btnId];
                delete inputs.isMouseDown[btnId];

                if (settings.showFinger && sprites.inputs.mouse[btnId]) {
                    sprites.inputs.mouse[btnId].visible = false;
                }
            }
        }
    }, passiveIfSupported);

    // 校正输入点的位置
    function getCurrentInputPosition(e) {
        let output = { x: 0, y: 0 };
        if (!fullscreen.check(pixi.view)) {
            output.x = e.pageX - pixi.view.offsetLeft;
            output.y = e.pageY - pixi.view.offsetTop;
        } else {
            output.x = e.clientX;
            output.y = e.clientY;
        }
        return output;
    }

    sprites = {
        mainContainer: new PIXI.Container(),
        mainContainerBlur: new PIXI.filters.BlurFilter(),
        inputs: {
            touches: {},
            mouse: {}
        },
        clickAnimate: [],
        ui: {}
    };

    sprites.mainContainerBlur.blur = 4;
    sprites.mainContainerBlur.repeatEdgePixels = true;
    sprites.mainContainerBlur.padding = 1;

    sprites.mainContainer.filters = [sprites.mainContainerBlur];

    sprites.mainContainer.sortableChildren = true;
    sprites.mainContainer.position.x = pixi.renderer.fixedWidthOffset;

    sprites.game = CreateChartSprites(_chart.data, pixi, sprites.mainContainer); // 创建所有的谱面精灵
    sprites.ui.start = CreateGameStartSprites(_chart.info, sprites.ui.start, pixi, sprites.mainContainer);
    sprites.ui.game = CreateChartInfoSprites(_chart.info, sprites.ui.game, pixi, sprites.mainContainer, true); // 创建谱面信息文字

    if (settings.accIndicator) { // 根据需求创建准度指示器
        sprites.ui.game.head.accIndicator = CreateAccurateIndicator(pixi, sprites.ui.game.head.container, settings.accIndicatorScale, settings.challengeMode);
    }
    score.init(sprites.game.notes.length, settings.challengeMode); // 计算分数

    if (settings.showJudgementRealTime) {
        let judge = {
            container: new PIXI.Container(),
            judge: new PIXI.Text('Judge: False', { fill: 'white', fontSize: 8 }),
            acc: new PIXI.Text('Acc: 0%', { fill: 'white', fontSize: 8 }),
            perfect: new PIXI.Text('Perfect: 0', { fill: 'white', fontSize: 8 }),
            good: new PIXI.Text('Good: 0', { fill: 'white', fontSize: 8 }),
            bad: new PIXI.Text('Bad: 0', { fill: 'white', fontSize: 8 }),
            miss: new PIXI.Text('Miss: 0', { fill: 'white', fontSize: 8 })
        }

        judge.container.zIndex = 1000000;
        judge.container.addChild(judge.judge, judge.acc, judge.perfect, judge.good, judge.bad, judge.miss);

        judge.acc.position.y = judge.judge.height;
        judge.perfect.position.y = judge.acc.position.y + judge.acc.height;
        judge.good.position.y = judge.perfect.position.y + judge.perfect.height;
        judge.bad.position.y = judge.good.position.y + judge.good.height;
        judge.miss.position.y = judge.bad.position.y + judge.bad.height;

        judge.container.position.set(8);

        pixi.stage.addChild(judge.container);
        sprites.judgeRealTime = judge;
    }

    sprites.mainContainer.sortChildren();
    pixi.stage.addChild(sprites.mainContainer);
    pixi.stage.sortChildren();

    // 适配 AudioContext 的 baseLatency
    _chart.audio.baseLatency = _chart.audio.context.audioContext.baseLatency ? _chart.audio.context.audioContext.baseLatency : 0;
    gameStart(1000);

    if (settings.showPerformanceIndicator && !sprites.performanceIndicator) {
        sprites.performanceIndicator = new Stats();
        sprites.performanceIndicator.showPanel(1);

        document.body.appendChild(sprites.performanceIndicator.dom);

        sprites.performanceIndicator.dom.style.position = 'fixed';
        sprites.performanceIndicator.dom.style.top = '0px';
        sprites.performanceIndicator.dom.style.left = 'unset';
        sprites.performanceIndicator.dom.style.right = '0px';
    }
}

/***
 * @function 启动游戏
 ***/
function gameStart(waitTime = 1000) {
    let startAnimateTimer = new Timer();
    let startAnimateBezier = new Cubic(.19, .36, .48, 1.01);
    let startAnimateTicker = async function() {
        let startUi = sprites.ui.start,
            gameHeadUi = sprites.ui.game.head,
            gameFootUi = sprites.ui.game.foot;

        if (startAnimateTimer.time < 0.67) { // 第一阶段，游戏 UI 入场，渐变显示歌曲信息
            gameHeadUi.container.position.y = -gameHeadUi.container.height * startAnimateBezier.solve(1 - (startAnimateTimer.time / 0.67));
            gameHeadUi.container.alpha = startAnimateTimer.time / 0.67;

            gameFootUi.container.position.y = gameHeadUi.container.height * startAnimateBezier.solve(1 - (startAnimateTimer.time / 0.67));
            gameFootUi.container.alpha = startAnimateTimer.time / 0.67;

            startUi.container.alpha = startAnimateTimer.time / 0.67;
            startUi.fakeJudgeline.width = startUi.fakeJudgeline.offsetWidth * startAnimateBezier.solve(startAnimateTimer.time / 0.67);
            sprites.game.background.children[0].alpha = 0.5 + ((1 - settings.backgroundDim) - 0.5) * (startAnimateTimer.time / 0.67);

        } else if (startAnimateTimer.time >= 0.67 && startAnimateTimer.time < 5.33) { // 第二阶段，固定 UI 的位置和透明度数据
            if (startUi.fakeJudgeline.visible === true) {
                startUi.fakeJudgeline.visible = false;

                for (let judgeLine of sprites.game.judgeLines) {
                    judgeLine.visible = true;
                }
                for (let note of sprites.game.notes) {
                    note.visible = true;
                }
                for (let note of sprites.game.fakeNotes) {
                    note.visible = true;
                }

                pixi.ticker.add(CalculateChartActualTime);
                if (settings.clickAnimate) pixi.ticker.add(CalculateClickAnimateActualTime); // 启动 Ticker 循环
            }

            gameHeadUi.container.position.y = 0;
            gameHeadUi.container.alpha = 1;

            gameFootUi.container.position.y = 0;
            gameFootUi.container.alpha = 1;

            sprites.ui.start.container.alpha = 1;

        } else if (startAnimateTimer.time >= 5.33 && startAnimateTimer.time < 6) { // 第三阶段，歌曲信息渐隐
            sprites.ui.start.container.alpha = 1 - ((startAnimateTimer.time - 5.33) / 0.67);

        } else if (startAnimateTimer.time >= 6) { // 第四阶段，隐藏歌曲信息，启动游戏
            sprites.ui.start.container.visible = false;

            stat.isTransitionEnd = true;
            stat.isRetrying = false;
            startAnimateTimer.stop();

            global.audio = await _chart.audio.play({ start: 0, volume: settings.musicVolume }); // 播放音乐并正式启动模拟器
            global.audioAnalyser = _chart.audio.media.nodes.analyser;
            global.audioAnalyser.fftSize = 256;
            global.audioAnalyser.bufferLength = global.audioAnalyser.frequencyBinCount;
            global.audioAnalyser.dataArray = new Uint8Array(global.audioAnalyser.bufferLength);

            if (stat.isPaused)
                _chart.audio.pause();

            pixi.ticker.remove(startAnimateTicker);
        }
    };

    sprites.mainContainerBlur.enabled = false;

    sprites.game.background.children[0].alpha = 0.5;
    sprites.ui.game.head.progressBar.position.x = 0;

    sprites.ui.start.fakeJudgeline.tint = settings.showApStatus ? 0xFFECA0 : 0xFFFFFF;
    sprites.ui.start.fakeJudgeline.visible = true;
    sprites.ui.start.fakeJudgeline.width = 0;

    for (let judgeLine of sprites.game.judgeLines) {
        judgeLine.visible = false;
    }
    for (let note of sprites.game.notes) {
        note.visible = false;
        note.isProcessed = false;
    }
    for (let note of sprites.game.fakeNotes) {
        note.visible = false;
    }

    sprites.ui.start.container.visible = true;

    // 留给设备处理大量数据的时间
    setTimeout(() => {
        stat.isEnd = false;
        stat.isTransitionEnd = false;

        startAnimateTimer.start();
        pixi.ticker.add(startAnimateTicker);
    }, waitTime);

    for (let name in textures.sound) { // 我不知道这是干啥的
        if (name !== 'levelOver') {
            textures.sound[name].play({ volume: 0 });
        }
    }

    document.getElementById('game-btn-pause').innerHTML = '<i class="mdui-icon material-icons">&#xe034;</i> 暂停';
}

function setCanvasFullscreen(forceInDocumentFull = false) {
    if (!pixi || !pixi.view) return;

    /**
    if (!fullscreen.enabled) {
    	mdui.alert('你的浏览器不支持全屏！', '前方高能');
    	return;
    }
    **/

    stat.isFullscreen = true;
    fullscreen.toggle(pixi.view, (forceInDocumentFull ? true : (!fullscreen.enabled || fullscreen.type == 2 ? true : false)));
}

function gamePause() {
    if (!pixi) return;
    if (!_chart.audio) return;
    if (stat.isEnd) return;

    if (!stat.isPaused) {
        _chart.audio.pause();
        sprites.ui.game.head.comboText.children[1].text = 'Paused';
        stat.isPaused = true;

        for (let clickAnimate of sprites.clickAnimate) {
            clickAnimate.children[0].stop();
        }

        sprites.mainContainerBlur.enabled = true;

        document.getElementById('game-btn-pause').innerHTML = '<i class="mdui-icon material-icons">&#xe037;</i> 继续';

    } else {
        global.audio = _chart.audio.play({ start: _chart.audio.duration * global.audio.progress, volume: settings.musicVolume });
        sprites.ui.game.head.comboText.children[1].text = settings.autoPlay ? 'Autoplay' : 'combo';
        stat.isPaused = false;

        for (let clickAnimate of sprites.clickAnimate) {
            clickAnimate.children[0].play();
        }

        sprites.mainContainerBlur.enabled = false;

        document.getElementById('game-btn-pause').innerHTML = '<i class="mdui-icon material-icons">&#xe034;</i> 暂停';
    }
}

function gameRestart() { // 游戏重试
    if (!pixi) return;
    if (!stat.isTransitionEnd || stat.isRetrying) return;

    stat.isRetrying = true;

    let fixedWidth = pixi.renderer.fixedWidth;
    let fixedWidthOffset = pixi.renderer.fixedWidthOffset;
    let noteSpeed = pixi.renderer.noteSpeed;
    let noteScale = pixi.renderer.noteScale;
    let rendererResolution = pixi.renderer.resolution;

    stat.isPaused = false;

    _chart.audio.stop();
    global.audio = null;

    if (global.levelOverAudio) {
        global.levelOverAudio.stop();
        global.levelOverAudio.destroy();
        global.levelOverAudio = null;
    }
    pixi.ticker.remove(CalculateChartActualTime);
    pixi.ticker.remove(CalculateClickAnimateActualTime);

    if (sprites.ui.end) {
        sprites.ui.end.container.destroy();
        sprites.ui.end = null;
    }

    for (let clickAnimate of sprites.clickAnimate) {
        clickAnimate.destroy();
    }
    sprites.clickAnimate.length = 0;

    for (let judgeLine of sprites.game.judgeLines) {
        judgeLine.angle = 0;
        judgeLine.alpha = 1;
        judgeLine.currentOffsetY = 0;
        judgeLine.tint = settings.showApStatus ? 0xFFECA0 : 0xFFFFFF;
        judgeLine.position.set(pixi.renderer.fixedWidth / 2, pixi.renderer.realHeight / 2);
    }

    for (let note of sprites.game.notes) {
        note.raw.score = 0;
        note.raw.accType = 0;
        note.raw.isScored = false;

        note.raw.isPressing = false;
        note.raw.pressTime = null;

        note.alpha = 1;

        if (note.raw.type == 3) {
            note.children[0].visible = true;

            note.children[1].position.y = 0;
            note.children[1].height = note.raw.holdLength * noteSpeed / noteScale;

            note.children[2].position.y = -note.children[1].height;
        }
    }
    for (let note of sprites.game.fakeNotes) {
        note.alpha = 1;

        if (note.raw.type == 3) {
            note.children[0].visible = true;

            note.children[1].position.y = 0;
            note.children[1].height = note.raw.holdLength * noteSpeed / noteScale;

            note.children[2].position.y = -note.children[1].height;
        }
    }

    sprites.ui.game.head.container.position.y = -sprites.ui.game.head.container.height;
    sprites.ui.game.foot.container.position.y = sprites.ui.game.head.container.height;

    sprites.ui.game.head.comboText.alpha = 0;
    sprites.ui.game.head.comboText.children[0].text = '0';
    sprites.ui.game.head.comboText.children[1].text = settings.autoPlay ? 'Autoplay' : 'combo';
    sprites.ui.game.head.scoreText.text = '0000000';

    judgements.length = 0;

    score.init(sprites.game.notes.length, settings.challengeMode);

    _chart.audio.baseLatency = _chart.audio.context.audioContext.baseLatency ? _chart.audio.context.audioContext.baseLatency : 0;
    global.baseAudioLatency = _chart.audio.context.audioContext.baseLatency ? _chart.audio.context.audioContext.baseLatency : 0;
    gameStart(200);
}

function gameDestroy() {
    if (!pixi) return;
    if (!sprites.mainContainer) return;
    if (!stat.isTransitionEnd) return;

    mdui.confirm('你真的要这么做吗？', '前方高能！', () => {
        /**
        try { // 我觉得这里应该是 Pixi 的问题，先做个报错静默
        	// 停止所有时钟
        	pixi.ticker.stop();
        	pixi.ticker.destroy();
        } catch (e) {
        	console.oldError(e);
        }
        **/
        clearInterval(sprites.ui.game.fpsInterval);

        // 清除所有的判定点
        judgements.length = 0;

        // 重置所有状态
        stat.isTransitionEnd = true;
        stat.isEnd = false;
        stat.isPaused = false;

        // 停止播放所有声音
        if (global.audio) {
            global.audio.stop();
            global.audio = null;
        }
        if (global.levelOverAudio) {
            global.levelOverAudio.stop();
            global.levelOverAudio.destroy();
            global.levelOverAudio = null;
        }

        for (let note of sprites.game.notes) {
            note.raw.score = 0;
            note.raw.isScored = false;
            note.raw.isProcessed = false;
            note.raw.isPressing = false;
            note.raw.pressTime = null;
        }

        // 清空 Sprites 对象
        sprites = {
            performanceIndicator: sprites.performanceIndicator
        };

        // 清空输入点信息
        inputs = {
            taps: [],
            touches: {},
            mouse: {},
            isMouseDown: {},
            keyboard: {}
        };

        // 销毁舞台
        pixi.destroy(true, { children: true });
        pixi = null;

        // 清除窗口的监听器
        window.onresize = null;

        // 重写原本在舞台区域的内容
        document.getElementById('game-canvas-box').innerHTML =
            '<div class="mdui-text-color-theme-disabled" style="font-family:\'Mina\'">' +
            '============== 设备信息 ==============<br>' +
            '设备类型：' + DeviceInfo.systemType + '<br>' +
            '设备系统：' + DeviceInfo.system + ' ' + DeviceInfo.systemVersion + '<br>' +
            '当前浏览器：' + DeviceInfo.browser + ' ' + DeviceInfo.browserVersion + '<br>' +
            '浏览器内核：' + DeviceInfo.browserEngine + '<br>' +
            '是否支持 WebGL：' + (DeviceInfo.supportWebGL ? '是' : '否') + '<br>' +
            '=========== 等待启动模拟器 ===========' +
            '</div>';

    });
}