const headerList = ["Map", "Time", "TPs", "Pts", "Tier", "Date", "Server"];
const bonusHeader = ["Map", "Stage", "Mode", "Time", "TPs", "Pts", "Date", "Server"];
const proxyURL = 'https://cors.bakar.moe/';

const TIERKEY = {
    "1": "Very Easy",
    "2": "Easy",
    "3": "Medium",
    "4": "Hard",
    "5": "Very Hard",
    "6": "Extreme",
    "7": "Death"
}
const TIERNUM = 7;

const MODEKEY = {
    "1": "KZT",
    "2": "SKZ",
    "3": "VNL"
}
const MODENUM = 3;

const modeList = {
    'kzt': 'kz_timer',
    'skz': 'kz_simple',
    'vnl': 'kz_vanilla'
}

const MODETEXT = {
    'kzt': 'KZTimer',
    'skz': 'SimpleKZ',
    'vnl': 'Vanilla'
}

const RANKING = {
    30: "GOD",
    29: "DEMIGOD",
    28: "PRO+",
    27: "PRO",
    26: "PRO",
    25: "PRO",
    24: "PRO-",
    23: "SEMIPRO+",
    22: "SEMIPRO",
    21: "SEMIPRO-",
    20: "EXPERT+",
    19: "EXPERT",
    18: "SKILLED+",
    17: "SKILLED",
    16: "SKILLED-",
    15: "REGULAR+",
    14: "REGULAR",
    13: "CASUAL+",
    12: "CASUAL",
    11: "CASUAL-",
    10: "TRAINEE+",
    9: "TRAINEE",
    8: "TRAINEE-",
    7: "SCRUB+",
    6: "SCRUB",
    5: "SCRUB",
    4: "SCRUB-",
    3: "NEWBIE",
    2: "NEWBIE",
    1: "NEWBIE",
    0: "NEWBIE"
}

const TIER_STYLE_CLASS = {
    1: "st0",
    2: "st1",
    3: "st2",
    4: "st5",
    5: "st4",
    6: "st9",
    7: "st12"
};

const STEAMID_PERSISTENT = "STEAMID-PERSISTENT";
const USE_STEAMID_PERSISTENT = "USE-STEAMID-PERSISTENT";

var mapCount;
var mapTierCount;
var mapDiffInfo;
var mapIndex;
var playerInfo = getEmptyPlayer();
var maps;
var globalTable;
var queryMode;
var myChart;
var URI = getURIVars();
var datapoints;
var proTop, protable;
var tpTop, tptable;
var mapWrCache = {};

function getTierStyleClass(tierValue) {
    const tier = Number(tierValue);
    return TIER_STYLE_CLASS[tier] || "";
}

function useSteamIDPersistent() {
    return localStorage.getItem(USE_STEAMID_PERSISTENT) !== null && localStorage.getItem(USE_STEAMID_PERSISTENT) === "true";

}

function persistentSteamIDExists() {
    //dont check if isvalidSteamID(), juse fill in whatever the user put in the input field
    return localStorage.getItem(STEAMID_PERSISTENT) !== null;
}

function updateCheckPersistentSteamID() {
    //dont check if isvalidSteamID(), juse fill in whatever the user put in the input field
    let curSteamID = $("#steamid-persistent-input").val();
    if (useSteamIDPersistent()) {
        localStorage.setItem(STEAMID_PERSISTENT, curSteamID);
    }
}


function getEmptyPlayer() {
    return {
        "player-name": "N/A",
        "profile-link": "",
        "avatar-link": "",
        "world-records": 0,
        "silvers": 0,
        "bronzes": 0,
        "run-type": "TP",
        "runs-total": 0,
        "runs-possible": 0,
        "points-total": 0,
        "points-average": 0,
        "runs-by-tier": new Array(TIERNUM + 1).fill(0),
        "runs-possible-by-tier": new Array(TIERNUM + 1).fill(0),
        "points-total-by-tier": new Array(TIERNUM + 1).fill(0),
        "points-average-by-tier": new Array(TIERNUM + 1).fill(0),
        "records-by-tier": new Array(TIERNUM + 1).fill(0),
        "silvers-by-tier": new Array(TIERNUM + 1).fill(0),
        "bronzes-by-tier": new Array(TIERNUM + 1).fill(0),
        "tier-max-maps": 1,
        "records-max-maps": 1,
        "silvers-max-maps": 1,
        "bronzes-max-maps": 1,
        "empty-flag": true
    }
}

function getEmptyDatapoints() {
    return {
        "protimes": [],
        "tptimes": [],
        "propoints": [],
        "tppoints": [],
        "teleports": [],
        "teleport-density": [],
        "top20tpavg": 0,
        "top20proavg": 0,
        "top100proavg": 0,
        "top100tpavg": 0,
        "top20prosd": 0,
        "top20tpsd": 0,
        "top100prosd": 0,
        "top100tpsd": 0,
        "top20procv": 0,
        "top20tpcv": 0,
        "top100procv": 0,
        "top100tpcv": 0,
        "tier": 0
    }
}

function getTimeFromSeconds(seconds) {
	var hours = Math.floor(seconds / 3600);
	seconds -= hours * 3600;
	var min = Math.floor(seconds / 60);
	seconds -= min * 60;
	seconds = seconds.toFixed(3)

	if (hours != 0){
		if (min < 10)
			min = "0" + min;
		if (seconds < 10)
			seconds = "0" + seconds;
		return hours + ":" + min + ":" + seconds;
	}
	else{
		if (min != 0){
			if (seconds < 10)
				seconds = "0" + seconds;
			return min + ":" + seconds;
		}
		else return seconds;
	}	
}

function getWrDiffColor(diffPercent) {
    if (diffPercent <= 10) {
        return "#22b14c";
    }
    if (diffPercent <= 30) {
        return "#ff8c1a";
    }
    return "#e53935";
}

function formatCompactTimeWithWrDiff(currentTimeSeconds, wrTimeSeconds) {
    const formattedTime = getTimeFromSeconds(currentTimeSeconds);
    if (!Number.isFinite(wrTimeSeconds) || wrTimeSeconds <= 0) {
        return formattedTime;
    }

    const diffSeconds = Math.max(0, currentTimeSeconds - wrTimeSeconds);
    if (diffSeconds <= 0.0005) {
        return formattedTime;
    }
    const diffPercent = (diffSeconds / wrTimeSeconds) * 100;
    const diffColor = getWrDiffColor(diffPercent);
    const formattedDiff = getTimeFromSeconds(diffSeconds);
    return `${formattedTime} <span style="color: ${diffColor};">(+${formattedDiff})</span>`;
}

function loadMapWrLookup(mode, hasTeleports, onDone) {
    const modeName = modeList[mode];
    const isOverall = hasTeleports ? "true" : "false";
    const cacheKey = `${modeName}|${isOverall}`;

    if (mapWrCache[cacheKey]) {
        onDone(mapWrCache[cacheKey]);
        return;
    }

    const wrURL = proxyURL + 'https://api.gokz.top/api/v1/maps/wrs?is_overall=' + isOverall + '&mode=' + modeName;
    $.getJSON(wrURL, function (wrData) {
        const wrLookup = {};
        wrData.forEach((wr) => {
            const mapName = wr["map_name"];
            const wrTime = +wr["time"];
            if (!mapName || !Number.isFinite(wrTime)) {
                return;
            }
            if (typeof wrLookup[mapName] === 'undefined' || wrTime < wrLookup[mapName]) {
                wrLookup[mapName] = wrTime;
            }
        });
        mapWrCache[cacheKey] = wrLookup;
        onDone(wrLookup);
    }).fail(function () {
        onDone({});
    });
}

function isValidSteamID(steamID) {
	return /^STEAM_[0-5]:[01]:\d+$/.test(steamID);
}

function getURIVars() {
	var vars = {};
	window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
		vars[key] = value;
	});
	return vars;
}

function retrieveStats(steamid32, hasTeleports, mode, init){
    var playerInfoURL = proxyURL + 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=018090A1CDA868EE72B2F70B79C54033&steamids=';
    var mapRequestBaseURL = proxyURL + "https://kztimerglobal.com/api/v1.0/records/top?steam_id=";
    let bonusLoadErrorNotified = false;

    function handleRequestError(message) {
        $("#steamButton").text('Fetch Times');
        alert(message);
    }
    
    if (isValidSteamID(steamid32) || init) {
        $("#steamButton").text('Fetching...');
    }
    else {
        alert("Please enter valid Steam ID!");
        return;
    }

    playerInfo = getEmptyPlayer();
    playerInfo["empty-flag"] = false;

    loadData();
    if(init){ return; }

    let steamid = steamid32.split(':');
    let steamid64 = BigInteger(BigInteger(steamid[2]).multiply(2).toString());
    if(steamid[1] === '1'){
        steamid64 = steamid64.add(BigInteger('76561197960265729')).toString();
    }
    else{
        steamid64 = steamid64.add(BigInteger('76561197960265728')).toString();
    }

    $.getJSON(playerInfoURL + steamid64, function(data){
        playerInfo["avatar-link"] = data.response.players[0].avatarfull;
        playerInfo["player-name"] = data.response.players[0].personaname;
        playerInfo["profile-link"] = data.response.players[0].profileurl;
        let shortname = playerInfo["player-name"];
        $("#playerLink").text(shortname);
        $("#playerLink").attr('href', playerInfo["profile-link"]);
        if(!playerInfo["empty-flag"]){
            $("#playerAvatar img").attr('src', playerInfo["avatar-link"]);
        }
    }).fail(function () {
        $("#playerAvatar img").attr('src', "./assets/images/kzlogo.png");
    });
    
    function loadData(){
        if(mode !== "bonus"){
            loadMap();
        }
        else{
            loadBonus();
        }
    }

    function loadMap(){
        let maplistURL = proxyURL + 'https://kztimerglobal.com/api/v1.0/maps?is_validated=true&limit=1000';
        mapCount = 0;
        mapTierCount = new Array(TIERNUM + 1).fill(0);
        mapDiffInfo = [];
        maps = [];
        mapIndex = [];

        $.getJSON(maplistURL, function(jsonData){
            jsonData.forEach((map) => {
                const mapMode = map["name"].split('_')[0];
                if(mode === 'kzt'){
                    if(mapMode !== 'skz' && mapMode !== 'vnl'){
                        if(!init && hasTeleports){
                            if(mapMode !== 'kzpro'){
                                addMap(map);
                            }
                        }
                        else{
                            addMap(map);
                        }
                    }
                }
                else if(mode === 'skz'){
                    if(mapMode !== 'vnl'){
                        if(!init && hasTeleports){
                            if(mapMode !== 'kzpro'){
                                addMap(map);
                            }
                        }
                        else{
                            addMap(map);
                        }
                    }
                }
                else if(mode === 'vnl'){
                    if(mapMode !== 'skz'){
                        if(!init && hasTeleports){
                            if(mapMode !== 'kzpro'){
                                addMap(map);
                            }
                        }
                        else{
                            addMap(map);
                        }
                    }
                }
            })
            if(!init){
                getMainStageRecords();
            } else {
                printPlayerProfile(false);
                genMainList();
                $("#steamButton").text('Fetch Times');
            }
        }).fail(function () {
            handleRequestError("Failed to load map list. Please refresh and retry.");
        });

        function addMap(map){
            maps.push([
                map["name"],
                "N/A",
                "N/A",
                0,
                map["difficulty"],
                "N/A",
                "N/A"
            ]);
            mapIndex[map["name"]] = mapCount;
            mapDiffInfo[map["name"]] = map["difficulty"];
            mapTierCount[map["difficulty"]]++;
            mapCount++;
        }
    }

    function loadBonus(){
        let bonuslistURL = "https://kz.bakar.moe/assets/json/stages.json";
        mapCount = 0;
        maps = [];
        mapIndex = [];
        $.getJSON(bonuslistURL, function(jsonData){
            jsonData.forEach((bonus) => {
                mapIndex[bonus["map_name"]] = mapCount;
                for(let i = 1; i <= bonus["stages"]; i++){
                    maps.push([
                        bonus["map_name"],
                        i,
                        "N/A",
                        "N/A",
                        "N/A",
                        0,
                        "N/A",
                        "N/A"
                    ]);
                }
                mapCount += bonus["stages"];
            })
            if(!init){
                getBonusRecords();
            } else {
                printPlayerProfile(true);
                genBonusList();
                $("#steamButton").text('Fetch Times');
            }
            playerInfo["runs-possible-by-tier"] = [0, mapCount, mapCount, mapCount, 0, 0];
        }).fail(function () {
            handleRequestError("Failed to load bonus map metadata. Please retry.");
        });
    }

    function getMainStageRecords(){
        if(!hasTeleports){
            playerInfo["run-type"] = "Pro";
        }

        let requestURL = mapRequestBaseURL + steamid32 + '&tickrate=128&stage=0&limit=1000&has_teleports=' + hasTeleports + '&modes_list_string=' + modeList[mode];

        loadMapWrLookup(mode, hasTeleports, function(mapWrLookup){
            $.getJSON(requestURL, function(jsonData){
                if (jsonData.length == 0) {
                    alert("No Times Found for " + steamid32);
                    $("#steamButton").text('Fetch Times');
                    return true;
                }
                window.history.pushState("object or string", "Title", "?steamid=" + steamid32 + "&teleports=" + hasTeleports + '&mode=' + queryMode);
                jsonData.forEach((record) => {
                    let mapName = record["map_name"];
                    let rawTime = +record["time"];
                    let tps = record["teleports"];
                    let pts = record["points"];
                    let tier = mapDiffInfo[mapName];
                    let date = record["created_on"].replace('T', ' ');
                    let server;
                    if (typeof record["server_name"] === "string") {
                        server = record["server_name"].substring(0, 35);
                    }
                    else{
                        server = 'N/A';
                    }
        
                    if(mapName && Number.isFinite(rawTime) && (typeof tps !== 'undefined') && pts && tier && date && server 
                        && (typeof mapIndex[mapName] !== 'undefined') && (pts > maps[mapIndex[mapName]][3])){
                        playerInfo["runs-total"]++;
                        playerInfo["runs-by-tier"][tier]++;
                        playerInfo["points-total"] += pts;
                        playerInfo["points-total-by-tier"][tier] += pts;
                        if(pts >= 800){
                            playerInfo["bronzes-by-tier"][tier]++;
                            if(pts < 900){
                                playerInfo["bronzes"]++;
                            }
                        }
                        if(pts >= 900){
                            playerInfo["silvers-by-tier"][tier]++;
                            if(pts < 1000){
                                playerInfo["silvers"]++;
                            }
                        }
                        if(pts == 1000){
                            pts = '🏆';
                            playerInfo["world-records"]++;
                            playerInfo["records-by-tier"][tier]++;
                        }
                        const wrTime = mapWrLookup[mapName];
                        const timeWithWrDiff = formatCompactTimeWithWrDiff(rawTime, wrTime);
                        maps[mapIndex[mapName]] = [
                            mapName,
                            timeWithWrDiff,
                            tps,
                            pts,
                            tier,
                            date,
                            server
                        ];
                    }
                });
                printPlayerProfile(false);
                genMainList();
                $("#steamButton").text("Fetch Times");
            }).fail(function () {
                handleRequestError("Failed to load player records. Please retry.");
            });
        });
    }

    function getBonusRecords(){
        let mode2short = {
            'kz_timer': 'KZT',
            'kz_simple': 'SKZ',
            'kz_vanilla': 'VNL'
        }
        let modeEnum = {
            'KZT': 1,
            'SKZ': 2,
            'VNL': 3
        }
        let mapCountChecker = [];

        for(let i = 1; i <= 8; i++){
            let requestURL = mapRequestBaseURL + steamid32 + '&tickrate=128&limit=1000&modes_list=[kz_timer,kz_simple,kz_vanilla]&stage=' + String(i);
            $.getJSON(requestURL, function(jsonData){
                console.log(jsonData);
                jsonData.forEach((record) => {
                    let mapName = record["map_name"];
                    let stage = record["stage"];
                    let mode = mode2short[record["mode"]];
                    let time = getTimeFromSeconds(record["time"]);
                    let tps = record["teleports"];
                    let pts = record["points"];
                    let date = record["created_on"].replace('T', ' ');
                    let server = record["server_name"].substring(0, 35);
                    let checkerName = mapName + String(stage);

                    if(mapName && stage && mode && time && (typeof tps !== 'undefined') && pts && date && server){
                        playerInfo["runs-by-tier"][modeEnum[mode]]++;
                        playerInfo["points-total"] += pts;
                        playerInfo["points-total-by-tier"][modeEnum[mode]] += pts;
                        if(pts >= 800){
                            playerInfo["bronzes-by-tier"][modeEnum[mode]]++;
                            if(pts < 900){
                                playerInfo["bronzes"]++;
                            }
                        }
                        if(pts >= 900){
                            playerInfo["silvers-by-tier"][modeEnum[mode]]++;
                            if(pts < 1000){
                                playerInfo["silvers"]++;
                            }
                        }
                        if(pts == 1000){
                            pts = '🏆';
                            playerInfo["world-records"]++;
                            playerInfo["records-by-tier"][modeEnum[mode]]++;
                        }
                        if(tps == 0){
                            tps = 'PRO';
                        }
                        if(mapCountChecker.indexOf(checkerName) == -1){
                            maps[mapIndex[mapName] + stage-1] = [
                                mapName,
                                stage,
                                mode,
                                time,
                                tps,
                                pts,
                                date,
                                server
                            ];
                            mapCountChecker.push(checkerName);
                            playerInfo["runs-total"]++;
                        }
                        else{
                            maps.push([
                                mapName,
                                stage,
                                mode,
                                time,
                                tps,
                                pts,
                                date,
                                server
                            ])
                        }
                    }
                })
                printPlayerProfile(true);
                genBonusList();
                $("#steamButton").text("Fetch Times");
            }).fail(function () {
                if (!bonusLoadErrorNotified) {
                    bonusLoadErrorNotified = true;
                    handleRequestError("Failed to load bonus records. Please retry.");
                }
            });
        }
    }
}

function genMainList(){
    if(globalTable){
        globalTable.destroy();
    }
    let colWidth = [215, 180, 65, 65, 70, 180, 275];
    let filterArray = [0, 4, 5, 6];
    let cols = [
        {
            className: "htLeft",
            readOnly: true,
            renderer: function(instance, td, row, col, prop, value, cellProperties) {
                Handsontable.renderers.TextRenderer.apply(this, arguments);
                const mapName = value || "";
                const tierColIndex = headerList.indexOf("Tier");
                const tierValue = instance.getDataAtCell(row, tierColIndex);
                const tierClass = getTierStyleClass(tierValue);
                td.innerHTML = "";
                const mapLink = document.createElement("span");
                mapLink.className = tierClass ? "table-link tier-rank " + tierClass : "table-link tier-rank";
                mapLink.textContent = mapName;
                mapLink.addEventListener("click", function () {
                    displayMap(mapName);
                    scrollPage();
                });
                td.appendChild(mapLink);
                return td;
            }
        },
        {
            className: "htLeft",
            readOnly: true,
            renderer: function(instance, td, row, col, prop, value, cellProperties) {
                td.innerHTML = value || "";
                td.style.whiteSpace = "nowrap";
                td.style.textAlign = "left";
                td.style.verticalAlign = "middle";
                return td;
            }
        },
        {readOnly: true},
        {
            readOnly: true,
            renderer: function(instance, td, row, col, prop, value, cellProperties) {
                const ptsValue = Number(value);
                const isWorldRecord = value === "🏆";
                let ptsClass = "";
                if (isWorldRecord || (!Number.isNaN(ptsValue) && ptsValue >= 900)) {
                    ptsClass = "pts-silver-glow";
                } else if (!Number.isNaN(ptsValue) && ptsValue >= 800) {
                    ptsClass = "pts-bronze-glow";
                }

                td.innerHTML = "";
                const ptsNode = document.createElement("span");
                ptsNode.className = ptsClass ? "pts-rank " + ptsClass : "pts-rank";
                ptsNode.textContent = (value === 0 ? "0" : (value || ""));
                td.appendChild(ptsNode);
                return td;
            }
        },
        {
            readOnly: true,
            renderer: function(instance, td, row, col, prop, value, cellProperties) {
                const tierClass = getTierStyleClass(value);
                td.innerHTML = "";
                const tierNode = document.createElement("span");
                tierNode.className = tierClass ? "tier-rank " + tierClass : "tier-rank";
                tierNode.textContent = value || "";
                td.appendChild(tierNode);
                return td;
            }
        },
        {readOnly: true},
        {readOnly: true}
    ];
    globalTable = generateTable($("#sheetContainer")[0], maps, headerList, colWidth, filterArray,{
        column: headerList.indexOf("Pts"),
        sortOrder: "desc"
    }, cols);
}

function genBonusList(){
    if(globalTable){
        globalTable.destroy();
    }
    let colWidth = [185, 70, 65, 85, 65, 65, 180, 275];
    let filterArray = [0, 1, 2, 6, 7];
    let cols = [
        {className: "htLeft", readOnly: true},
        {readOnly: true},
        {readOnly: true},
        {readOnly: true},
        {readOnly: true},
        {readOnly: true},
        {readOnly: true},
        {readOnly: true}
    ];
    globalTable = generateTable($("#sheetContainer")[0], maps, bonusHeader, colWidth, filterArray,{
        column: bonusHeader.indexOf("Pts"),
        sortOrder: "desc"
    }, cols);
}

function generateTable(container, data, header, colWidth, filterArray, initialSort, cols){

	//var narrowHeaders = ["time","tier", "length"];
	var wideHeaders = ["map", "server", "date"];

	function isNarrowHeader(myHeader) {
		//see if it's a narrow input field
		return !(new RegExp(wideHeaders.join("|")).test(myHeader));
	}

	var debounceFn = Handsontable.helper.debounce(function (colIndex, event) {
		var filtersPlugin = mapTable.getPlugin('filters');

		filtersPlugin.removeConditions(colIndex);
		filtersPlugin.addCondition(colIndex, 'contains', [event.realTarget.value]);
		filtersPlugin.filter();
	}, 200);

	var addEventListeners = function (input, colIndex) {
		input.addEventListener('keydown', function (event) {
			debounceFn(colIndex, event);
		});
	};

	// Build elements which will be displayed in header.
	var getInitializedElements = function (colIndex) {
		var div = document.createElement('div');
		var input = document.createElement('input');

		div.className = 'filterHeader';

		addEventListeners(input, colIndex);

		div.appendChild(input);

		return div;
	};

	// Add elements to header on `afterGetColHeader` hook.
	var addInput = function (col, TH) {
		// Hooks can return value other than number (for example `columnSorting` plugin use this).
		if (typeof col !== 'number') {
			return col;
		}

			if (TH.childElementCount < 2) {
				for (let i = 0; i < filterArray.length; i++) {
					if (col === filterArray[i]) {
						TH.appendChild(getInitializedElements(col));
					}
				}
			}
		};

	// Deselect column after click on input.
	var doNotSelectColumn = function (event, coords) {
		if (coords.row === -1 && event.realTarget.nodeName === 'INPUT') {
			event.stopImmediatePropagation();
			this.deselectCell();
		}
	};

		const sortConfig = initialSort || {
			column: 0,
			sortOrder: "asc"
		};
    
    var mapTable = new Handsontable(container, {
        data: data,
        height: 890,
        colHeaders: header,
        colWidths: colWidth,
        rowHeights: 28,
        filters: true,
        multiColumnSorting: {
            initialConfig: sortConfig
        },
        columns: cols,
		afterGetColHeader: addInput,
        beforeOnCellMouseDown: doNotSelectColumn,
        licenseKey: 'non-commercial-and-evaluation'
    });

    const WIDTH_OFFSET = 17;

    mapTable.updateSettings({
        width: $("#" + container.id + " .wtHider").width() + WIDTH_OFFSET
    })

    $("#" + container.id).css('margin-top', '20px');
    $("#sheetContainer .ht_clone_top").prepend('<div class="blur"></div>');
    return mapTable;
}

function printPlayerProfile(isbonus) {
    if(!playerInfo["empty-flag"]){
        playerInfo["runs-possible"] = mapCount;
        if(!isbonus){
            playerInfo["runs-possible-by-tier"] = mapTierCount;
        }
    }
    if(!isbonus){
        playerInfo["points-average"] = (playerInfo["points-total"] / playerInfo["runs-total"] || 0).toFixed(1);
    }
    else{
        playerInfo["run-type"] = "Bonus"
        playerInfo["points-average"] = (playerInfo["points-total"] / (playerInfo["runs-by-tier"][0]+playerInfo["runs-by-tier"][1]+playerInfo["runs-by-tier"][2]) || 0).toFixed(1);
    }
    var runPercentage = (100 * playerInfo["runs-total"] / playerInfo["runs-possible"] || 0).toFixed(1);
    $("#playerContainer").show();

    let shortname = playerInfo["player-name"].substring(0, 20);
    $("#playerLink").text(shortname);
    $("#wr").text(playerInfo["world-records"]);
    $("#silver").text(playerInfo["silvers"]);
    $("#bronze").text(playerInfo["bronzes"]);
    $("#playerTimes").text(`${playerInfo["runs-total"]}/${playerInfo["runs-possible"]} ${playerInfo["run-type"]} Times (${runPercentage}%)`);
    $("#playerPoints").text(`${playerInfo["points-total"].toLocaleString("en")} (Avg. ${playerInfo["points-average"]})`);
    if (playerInfo["run-type"] === "Pro") {
        $('#runtype-divider').text("Pro Runs");
    } else if (playerInfo["run-type"] === "TP") {
        $('#runtype-divider').text("TP Runs");
    } else if (playerInfo["run-type"] === "Bonus") {
        $('#runtype-divider').text("Bonus Runs");
    }
    for (var tier in (isbonus ? MODEKEY : TIERKEY)) {
        var tierMax = playerInfo["runs-by-tier"][tier];
        var tierRecordsMax = playerInfo["records-by-tier"][tier];
        var tierSilversMax = playerInfo["silvers-by-tier"][tier];
        var tierBronzesMax = playerInfo["bronzes-by-tier"][tier];
        var tierRuns = playerInfo["runs-by-tier"][tier];
        var tierPercentage = Math.floor(100 * tierRuns / tierMax) || 0;
        var tierAveragePoints = playerInfo["points-total-by-tier"][tier] / playerInfo["runs-by-tier"][tier];

        if (tierMax > playerInfo["runs-by-tier"][playerInfo["tier-max-maps"]]) {
            playerInfo["tier-max-maps"] = tier;
        }
        if (tierRecordsMax > playerInfo["records-by-tier"][playerInfo["records-max-maps"]]) {
            playerInfo["records-max-maps"] = tier;
        }
        if (tierSilversMax > playerInfo["silvers-by-tier"][playerInfo["silvers-max-maps"]]) {
            playerInfo["silvers-max-maps"] = tier;
        }
        if (tierBronzesMax > playerInfo["bronzes-by-tier"][playerInfo["bronzes-max-maps"]]) {
            playerInfo["bronzes-max-maps"] = tier;
        }

        playerInfo["points-average-by-tier"][tier] = tierAveragePoints.toFixed(1);

        /*
        var $progressBarContainer = $(".progressbar-main");
        var $progressBar = $(`<div id="progressbar-${tier}"class='progressbar'></div>`);
        $progressBarContainer.append($progressBar);
        var $progressLabel = $(`<div class="progress-label">${tierText}</div>`);
        var $progressBarTrack = $(`<div class="before"><div class="bar tuse color${tier}" id="progressColorBar-${tier}" style="width: 0"><span></span></div></div>`);
        var $progessCountLabel = $(`<div class="progress-count-label" id="progress-count-label-${tier}"></div>`);
        var $progressEndLabel = $(`<div class="progress-end-label" id="progress-end-label-${tier}"></div>`);
        
        $progressBar.append($progressLabel);
        $progressBar.append($progressBarTrack);
        $progressBar.append($progessCountLabel);
        $progressBar.append($progressEndLabel);
        $progressBarContainer.append($progressBar);
        */
    }
    
    $("#playerRank").text(getRanking());
    
    function getRanking() {
        let wrPoints = 1000;
        let goldToSilver = 20
          , goldToBronze = 50
          , goldToUnranked = 500;
        let silverPoints = Math.floor(wrPoints / goldToSilver);
        let bronzePoints = Math.floor(wrPoints / goldToBronze);
        let unrankedPoints = Math.floor(wrPoints / goldToUnranked);
        let rankedMaps = playerInfo["world-records"] + playerInfo["silvers"] + playerInfo["bronzes"];
        let unrankedMaps = playerInfo["runs-total"] - rankedMaps;
        let placementTotal = playerInfo["world-records"] * wrPoints + +playerInfo["silvers"] * silverPoints + playerInfo["bronzes"] * bronzePoints + unrankedMaps * unrankedPoints;
        let r_base = 2.5;
        let placementRanking = getPlacementRank(placementTotal, r_base);
        let placementMax = getPlacementRank(playerInfo["runs-possible"] * wrPoints, r_base);
        let normalizedPlacementRating = placementRanking / placementMax;
        let steepPlacement = 3.0;
        let placementMid = getPlacementRank(200, r_base) / placementMax;
        let placementRating = sigmoid(normalizedPlacementRating, 1.0, steepPlacement, placementMid);
        let pointsMax = playerInfo["runs-possible"] * wrPoints;
        let pointsMid = .25
          , steepPoints = 3.5;
        if (playerInfo["run-type"] === "Pro") {
            pointsMid = pointsMid * 0.3;
        }
        let normalizedPoints = playerInfo["points-total"] / pointsMax;
        let pointsRating = sigmoid(normalizedPoints, 1.0, steepPoints, pointsMid);
        let pointsWeight = .1
          , placementWeight = .8
          , avgWeight = 1 - (placementWeight + pointsWeight);
        let finalRating = pointsWeight * pointsRating + placementWeight * placementRating + avgWeight * (playerInfo["points-average"] / 1000);
        finalRating = (10 * Math.max(0, finalRating || 0));
        let goldBonus = Math.min(playerInfo["world-records"], Math.min(1.25, Math.log(10 + playerInfo["world-records"]) / 3));
        let silverBonus = Math.min(playerInfo["silvers"] / 20, Math.min(0.5, Math.log(10 + playerInfo["silvers"]) / 8));
        finalRating = finalRating + (goldBonus + silverBonus);
        finalRating *= 3;
        let rankText = RANKING[Math.floor(finalRating)] || RANKING[0];
        
        $("#playerRank").attr('title', finalRating.toFixed(2));
        return rankText;
    }

    function getPlacementRank(r_val, r_base) {
        if (!r_val || r_val <= 0) {
            return 0;
        }
        return Math.log(r_val) / Math.log(r_base);
    }

    let value = $("#progressType").val();
    let checked = $("#normalize-checkbox").prop("checked");
    changeProgress(value, checked, isbonus);
}

function isBonusProgressMode(isbonus) {
    if (typeof isbonus === "boolean") {
        return isbonus;
    }
    return queryMode === "bonus";
}

function getProgressElementSelector(tier, isbonus, elementType) {
    const prefix = isBonusProgressMode(isbonus) ? "bonus-" : "";
    return `#${prefix}${elementType}-${tier}`;
}

function changeProgress(value, checked, isbonus){
    const bonusMode = isBonusProgressMode(isbonus);
    const progressSize = bonusMode ? MODENUM : TIERNUM;

    if(value === "bar-total"){
        showProgressTotal("runs-by-tier", "tier-max-maps");
    }
    else if(value === "bar-avg"){
        localStorage.setItem("SHOW_PROGRESS_BARS", value);
        for (let i = 1; i <= progressSize; i++) {
            let avgPoints = +playerInfo["points-average-by-tier"][i] || 0;
            let curPercentage = getPercentage(avgPoints, 0, 1000);
            setProgressWdith($(getProgressElementSelector(i, bonusMode, "progressColorBar")), curPercentage, avgPoints || 0);
            $(getProgressElementSelector(i, bonusMode, "progress-count-label")).text(avgPoints.toFixed(0));
            $(getProgressElementSelector(i, bonusMode, "progress-end-label")).empty();
        }
    }
    else if(value === "bar-wr"){
        showProgressTotal("records-by-tier", "records-max-maps");
    }
    else if(value === "bar-silver"){
        showProgressTotal("silvers-by-tier", "silvers-max-maps");
    }
    else if(value === "bar-bronze"){
        showProgressTotal("bronzes-by-tier", "bronzes-max-maps");
    }

    function showProgressTotal(playerInfoKey, playerInfoSubKey) {
        $('.progress-bar-display-container').show();
        for (let i = 1; i <= progressSize; i++) {
            let curVal = +playerInfo[playerInfoKey][i];
            let curMax = playerInfo[playerInfoKey][playerInfo[playerInfoSubKey]];
            setProgressBar(curVal, curMax, i);
        }
    }

    function setProgressBar(val, max, tier) {
        let progressBar = $(getProgressElementSelector(tier, bonusMode, "progressColorBar"));
        let normalizeText = val;
        let counttext = val;
        if (checked) {
            max = +playerInfo["runs-possible-by-tier"][tier];
        }
        let percentage = getPercentage(val, 0, max);
        if (checked) {
            normalizeText = percentage.toFixed(1) + "%";
            counttext = val + '/' + max;
        }
        $(getProgressElementSelector(tier, bonusMode, "progress-count-label")).text(counttext);
        setProgressWdith(progressBar, percentage);
        if(checked){
            $(getProgressElementSelector(tier, bonusMode, "progress-end-label")).text(normalizeText);
        }
        else{
            $(getProgressElementSelector(tier, bonusMode, "progress-end-label")).empty();
        }
    }

    function setProgressWdith($myProgressBar, percentageWidth) {
        $myProgressBar.css("width", percentageWidth + "%");
    }
    function getPercentage(value, min, max) {
        return (100 * value / max) || 0;
    }
}

function displayMap(curmap) {
    let proURL = proxyURL + 'https://kztimerglobal.com/api/v1.0/records/top?modes_list_string=' + modeList[queryMode] + '&stage=0&has_teleports=false&limit=100&tickrate=128&map_name=' + curmap,
        tpURL = proxyURL + 'https://kztimerglobal.com/api/v1.0/records/top?modes_list_string=' + modeList[queryMode] + '&stage=0&has_teleports=true&limit=100&tickrate=128&map_name=' + curmap,
        imgURL = proxyURL + 'https://raw.githubusercontent.com/KZGlobalTeam/map-images/public/webp/thumb/' + curmap + '.webp';

    protable = [];
    tptable = [];

    let proSteamIDList = [];
    let tpSteamIDList = [];
    
    const urls = {
        "pro": proURL,
        "tp": tpURL
    };

    datapoints = getEmptyDatapoints();

    $('#mapName').text(curmap);
    $('#mapMode').text(MODETEXT[queryMode]);
    $('#tierText').text(mapDiffInfo[curmap]);
    $('#pro-wrtime').text('N/A');
    $('#tp-wrtime').text('N/A');
    $("#mapImage img").attr('src', imgURL);

    $("#mapInfoContainer").show();

    for (const url in urls) {
        $.getJSON(urls[url], function (data) {
            if (data.length == 0) {
                //alert("No " + url + " times found for " + curmap + "!");
                return true;
            }

            let pointsData = [],
                timeData = [],
                teleportData = [];

            $.each(data, function (i, field) {
                var player = field["player_name"].substring(0, 20);
                var teleports = field["teleports"];
                var time = getTimeFromSeconds(+field["time"]);
                var points = field["points"];
                var server = field["server_name"];
                var steam_id = field["steam_id"];
                if (server !== null)
                    server = server.substring(0, 17);
                var date = field["created_on"].substring(0, 10);

                pointsData.push(points);
                timeData.push(+field["time"]);
                teleportData.push(teleports);

                if(url === 'pro'){
                    protable.push([
                        i+1,
                        player,
                        time,
                        points,
                        date,
                        server
                    ]);
                    proSteamIDList.push(steam_id);
                }
                else{
                    tptable.push([
                        i+1,
                        player,
                        time,
                        points,
                        teleports,
                        date,
                        server
                    ]);
                    tpSteamIDList.push(steam_id);
                }
            })

            proTop = genTop($(".pro-table")[0], 'pro', protable);
            tpTop = genTop($(".tp-table")[0], 'tp', tptable);
            $(".table-container .ht_clone_top").prepend('<div class="blur"></div>');

            var wrtime = getTimeFromSeconds(timeData[0]);
            
            if (url === "pro") {
                datapoints["protimes"] = timeData;
                datapoints["propoints"] = pointsData;
                if(wrtime){
                    $("#pro-wrtime").text(wrtime);
                }
            } else {
                datapoints["tptimes"] = timeData;
                datapoints["tppoints"] = pointsData;
                datapoints["teleports"] = teleportData;
                if(wrtime){
                    $("#tp-wrtime").text(wrtime);
                }
            }

            createChart('time');
        });
    }

    function genTop(container, mode, data){
        let proheader = ['', 'Player', 'Time', 'Pts', 'Date', 'Server']
        let tpheader = ['', 'Player', 'Time', 'Pts', 'TPs', 'Date', 'Server'];
        let procols = [
            {readOnly: true},
            {
                className: 'htLeft', 
                readOnly: true,
                renderer: function(instance, td, row, col, prop, value, cellProperties) {
                    Handsontable.renderers.TextRenderer.apply(this, arguments);
                    const steamId = encodeURIComponent(proSteamIDList[row] || "");
                    const modeParam = encodeURIComponent(queryMode || "kzt");
                    const link = document.createElement("a");
                    link.className = "table-link";
                    link.href = `./?steamid=${steamId}&teleports=false&mode=${modeParam}`;
                    link.textContent = value || "";
                    td.innerHTML = "";
                    td.appendChild(link);
                    return td;
                }
            },
            {readOnly: true},
            {readOnly: true},
            {readOnly: true},
            {readOnly: true}
        ]
        let tpcols = [
            {readOnly: true},
            {
                className: 'htLeft', 
                readOnly: true,
                renderer: function(instance, td, row, col, prop, value, cellProperties) {
                    Handsontable.renderers.TextRenderer.apply(this, arguments);
                    const steamId = encodeURIComponent(tpSteamIDList[row] || "");
                    const modeParam = encodeURIComponent(queryMode || "kzt");
                    const link = document.createElement("a");
                    link.className = "table-link";
                    link.href = `./?steamid=${steamId}&teleports=true&mode=${modeParam}`;
                    link.textContent = value || "";
                    td.innerHTML = "";
                    td.appendChild(link);
                    return td;
                }
            },
            {readOnly: true},
            {readOnly: true},
            {readOnly: true},
            {readOnly: true},
            {readOnly: true}
        ];
        let prowidth = [30, 150, 80, 44, 77, 172]
        let tpwidth = [30, 150, 75, 44, 50, 77, 127]

        if(mode === 'pro'){
            if(proTop){
                proTop.destroy();
            }     
            let mapTable = new Handsontable(container, {
                data: data,
                height: 850,
                colHeaders: proheader,
                colWidths: prowidth,
                rowHeights: 42,
                columns: procols,
                licenseKey: 'non-commercial-and-evaluation'
            });
    
            return mapTable;  
        }
        else if(mode === 'tp'){
            if(tpTop){
                tpTop.destroy();
            }
            let mapTable = new Handsontable(container, {
                data: data,
                height: 850,
                colHeaders: tpheader,
                colWidths: tpwidth,
                rowHeights: 42,
                columns: tpcols,
                licenseKey: 'non-commercial-and-evaluation'
            });
    
            return mapTable;
        }

    }
}

function createChart(type) {
    let prodata, tpdata;
    if(type === 'time'){
        prodata = datapoints["protimes"];
        tpdata = datapoints["tptimes"];
    }
    else if(type === 'point'){
        prodata = datapoints["propoints"];
        tpdata = datapoints["tppoints"];
    }
    else if(type === 'teleports'){
        prodata = datapoints["teleports"];
        tpdata = datapoints["teleports"];
    }

    let ctx = document.getElementById('myChart').getContext('2d');
    let graphType = 'line';
    let tooltipCallback = {};
    let tickCallback = function(item, index) {
        if (item % 1 === 0) {
            return item;
        }
    }
    let proLabel = "Pro Points";
    let tpLabel = "TP Points";
    let max = Math.max(...prodata);
    max = Math.max(max, ...tpdata);
    let min = Math.min(...prodata);
    min = Math.min(min, ...tpdata);
    let len = Math.max(prodata.length, tpdata.length);
    let probackgroundFill = 'orange';
    let tpbackgroundFill = 'limegreen';
    let datasets;

    if (type === "time") {
        tooltipCallback = {
            label: function(tooltipItem, data) {
                const indice = tooltipItem.index;
                const index = tooltipItem.datasetIndex;
                return (index === 0 ? "Pro " : "TP ") + getTimeFromSeconds(data.datasets[tooltipItem.datasetIndex].data[indice]);
            }
        };
        tickCallback = function(item, index) {
            if (index === 0 || index % 2 === 0)
                return getTimeFromSeconds(item);
        }
        ;
        proLabel = "Pro Times";
        tpLabel = "TP Times";
    } else if (type === "teleports") {
        tpLabel = "Teleports";
        graphType = 'bar';
        min = 0;
        max = Math.max(max, 5);
    }

    let labels = [];
    for (let i = 1; i <= len; i++) {
        labels.push(i);
    }
    labels[0] = "WR";
    const title = (type.charAt(0).toUpperCase() + type.slice(1)) + ' Progression for Top 100';

    datasets = [{
        label: proLabel,
        fill: false,
        data: prodata,
        backgroundColor: probackgroundFill,
        borderColor: probackgroundFill,
        pointBackgroundColor: probackgroundFill,
        pointBorderColor: probackgroundFill,
        yAxisID: 'A',
        borderWidth: 2,
        radius: 0,
    }, {
        label: tpLabel,
        fill: false,
        data: tpdata,
        backgroundColor: tpbackgroundFill,
        borderColor: tpbackgroundFill,
        pointBackgroundColor: tpbackgroundFill,
        pointBorderColor: tpbackgroundFill,
        yAxisID: 'A',
        borderWidth: 2,
        radius: 0,
    }];

    if(type === 'teleports'){
        datasets.shift();
    }

    let chartConfig = {
        type: graphType,
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            title: {
                display: true,
                text: title,
                fontColor: '#d8d8d8',
                fontFamily: 'jaldi',
                fontSize: 16
            },
            legend: {
                labels:{
                    fontColor: '#d8d8d8',
                    fontFamily: 'jaldi',
                    fontSize: 15
                }
            },
            responsive: true,
            tooltips: {
                mode: 'index',
                intersect: false,
                callbacks: tooltipCallback
            },
            hover: {
                mode: 'index',
                intersect: false,
            },
            elements: {
                point: {
                    radius: 1
                }
            },
            scales: {
                yAxes: [{
                    id: 'A',
                    type: 'linear',
                    position: 'left',
                    ticks: {
                        max: max,
                        min: min,
                        fontColor: '#d8d8d8',
                        fontFamily: 'jaldi',
                        fontSize: 15,
                        userCallback: tickCallback,
                    },
                    gridLines: {
                        color: 'rgba(215,215,215,0.15)'
                    }
                }],
                xAxes: [{
                    ticks: {
                        beginAtZero: true,
                        autoSkip: true,
                        maxTicksLimit: 22,
                        fontColor: '#d8d8d8',
                        fontFamily: 'jaldi',
                        fontSize: 15
                    },
                    gridLines: {
                        color: 'rgba(215,215,215,0.15)'
                    }
                }],
            },
            animation: {
                easing: 'easeOutSine'
            }
        }
    }
    
    if (typeof myChart === 'undefined') {
        myChart = new Chart(ctx,chartConfig);
    } else {
        myChart.destroy();
        myChart = new Chart(ctx,chartConfig);
    }
}

function scrollPage(){
    $('html,body').animate({
        scrollTop: $("#mapInfoContainer").offset().top}, {duration: 500, easing: 'swing'
    })
}

function setPage(){
    $(`#nav-${queryMode}`).addClass("layui-this");
    if(queryMode === 'bonus'){
        $(".layui-form-radio").addClass("layui-disabled");
        $(".layui-form-radio").addClass("layui-form-radioed");
        $("input[type=radio]").attr('disabled','');
        $(".layui-form-checkbox").removeClass("layui-form-checked");
        $(".layui-form-checkbox").addClass("layui-checkbox-disabled");
        $(".layui-form-checkbox").addClass("layui-disabled");
        $("input[type=checkbox]").attr('disabled','');
        $(".progressbar-bonus").show();
        $(".progressbar-main").hide();
    }
    else{
        $(".progressbar-main").show();
        $(".progressbar-bonus").hide();
    }
}

layui.use('element', function(){
    var element = layui.element; //导航的hover效果、二级菜单等功能，需要依赖element模块
    
    //监听导航点击
    element.on('nav(demo)', function(elem){
        //console.log(elem)
        layer.msg(elem.text());
    });
});

layui.use(['layer', 'jquery', 'form'], function () {
    var layer = layui.layer,
            $ = layui.jquery,
            form = layui.form;

    form.on('select(progressChange)', function(data){
        changeProgress(data.value, $("#normalize-checkbox")[0].checked, queryMode === "bonus");
        form.render('select');//select是固定写法 不是选择器
    });

    form.on('select(chartChange)', function(data){
        createChart(data.value);
        form.render('select');
    });

    form.on('checkbox(checkboxChange)', function(data){
        changeProgress($("#progressType").val(), data.elem.checked, queryMode === "bonus");
    });

    form.on('checkbox(steamIDPersistentCheckbox)', function(data){
        let stillUse = data.elem.checked;
        let steamIDText = $("#steamid-persistent-input").val();
        localStorage.setItem(USE_STEAMID_PERSISTENT, stillUse);

        if (!stillUse) {
            localStorage.removeItem(STEAMID_PERSISTENT);
        } else {
            localStorage.setItem(STEAMID_PERSISTENT, steamIDText);
        }
    })

    $(document).ajaxStop(function() {});
    $(document).ready(function(){
        $.ajaxSetup({cache: false});
        $(".layui-layout").css('min-height', window.innerHeight);
        if(typeof URI['mode'] !== 'undefined'){
            queryMode = URI['mode'];
        }
        else{
            queryMode = 'kzt';
        }

        let steamID = "";
        let isbonus = (queryMode === 'bonus');

        printPlayerProfile(isbonus);

        if (typeof URI["steamid"] !== 'undefined' && URI["teleports"] !== 'undefined') {
            steamID = URI["steamid"];
            const teleports = URI["teleports"];
            if (isValidSteamID(steamID)) {
                $('#steamIDText').val(steamID);
                const teleportsBool = ("true" === teleports);
                retrieveStats(steamID, teleportsBool, queryMode, false);
                if(!isbonus){
                    if (teleportsBool) {
                        $('#tprun').click();
                    } else {
                        $('#prorun').click();
                    }
                }
            }
        } else {
            if (useSteamIDPersistent() && persistentSteamIDExists()) {
                var potentialSteamID = localStorage.getItem(STEAMID_PERSISTENT);
                $("#steamid-persistent-input").val(potentialSteamID);
                $("#steamid-persistent-checkbox").prop('checked', true);
                $('#steamIDText').val(potentialSteamID);
                if (isValidSteamID(potentialSteamID)) {
                    $('#tprun').click();
                    retrieveStats(potentialSteamID, true, queryMode, false);
                }
            } else {
                retrieveStats(null, null, queryMode, true);
            }
        }
        setPage();
        form.render();
    });

    $("#steamButton").click(function(){
        var steamid32 = $("#steamIDText").val();
        var isprorun = $("input[name=isprorun]:checked").val();
        var hasTeleports = true;
        if(isprorun === "Pro"){
            hasTeleports = false;
        }
        retrieveStats(steamid32, hasTeleports, queryMode, false);
    });
});

