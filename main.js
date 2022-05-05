/** @format */

var ENABLE_LOG = false;
var SHOW_JSON = false;
var WITH_JOCK = false;

var FACTOR_DISTANCE_AND_TRACK_DISTANCE_PERCENT = 20;
var FACTOR_WEIGHT_PERCENT = 20;
var FACTOR_NUMBER_OF_RUNNER_PERCENT = 15;
var FACTOR_TRACK_CONDITION_PERCENT = 10;
var FACTOR_AVERAGE_PRICE_MONEY_PERCENT = 20;
var FACTOR_BARRIER_PERCENT = 5;

var jockeyList = {};

function readSample() {
    const url = "./data5.json";

    console.log("read file response = " + url);
    fetch(url)
        .then(response => {
            return response.json();
        })
        .then(jsondata => process_race(jsondata));
}

function readJockeys() {
    submitForm(true);
    // const url = "./jockeys.json";
    // fetch(url)
    //     .then(response => {
    //         // console.log("response == " + JSON.stringify(response.json()));
    //         return response.json();
    //     })
    //     .then(jsondata => {
    //         jockeyList = jsondata
    //         submitForm(true);
    //     });
}

function onChange(event) {
    var reader = new FileReader();
    reader.onload = onReaderLoad;
    reader.readAsText(event.target.files[0]);
}

function onReaderLoad(event) {

    var obj = JSON.parse(event.target.result);
    process_race(obj);
}


function submitForm(withJock = false) {
    WITH_JOCK = withJock;
    var bypassCORSURL = "https://corsproxy.giadang.com?url=";
    var url = document.getElementById("url").value;
    if(!url.includes("https")){ url = "https://" + url; }
    console.log("2222 url = " + url);
    $.ajax({
        url: bypassCORSURL + url,
        type: "GET",
        success: function (response) {
            var nodes = $.parseHTML(response);
            for (var i = 0; i < nodes.length; i++) {
                var node = $(nodes[i]);
                if (node.is("script#__NEXT_DATA__")) {
                    var obj = JSON.parse(node.text());
                    if (SHOW_JSON == true) {
                        console.log(node.text());
                    }
                    process_race(obj);
                }
            }
        },
        error: function (xhr, status) {
            logger("error");
        },
    });
}

function process_race(info) {
    var table = document.getElementById("horses_table_body");
    table.innerHTML = "";

    var race = info.props.pageProps.initialReduxState.race;

    document.getElementById("track_name").innerHTML =
        "Track name: " + race.trackName + " " + race.RaceNumber;
    document.getElementById("track_distance").innerHTML =
        "Track distance: " + race.Distance;
    document.getElementById("track_condition").innerHTML =
        "Track condition: " + race.Meeting.TrackCondition;

    process_horse(table, race);
}

// Process horses
async function process_horse(table, race) {
    var state = race.Meeting.State;
    var pointsCellArray = [];
    var averagePrizeArray = [];
    var availableRunners = [];
    var commentCellArray = [];
    var pointBreakdownComentArray = [];
    var totalPrizePool = 0;
    var allRunners = race.Runners;
    var averageOnlyPrizeArray = [];

    if (WITH_JOCK) {
        await loadJockeysForState(state);
    }
    allRunners.sort(compareRunnerByWeight);
    var runnersSortedByPrize = race.Runners;
    var highestWeight = allRunners[allRunners.length - 1].Weight.Total;
    var lowestWeight = allRunners[0].Weight.Total;
    race.Runners.forEach((runner) => {
        var status = runner.Status;
        if (status != "Scratched") {
            availableRunners.push(runner);
            // Create an empty <tr> element and add it to the 1st position of the table:
            var row = table.insertRow();
            // Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:
            var nameCell = row.insertCell();
            var saddleNumberCell = row.insertCell();
            var ageCell = row.insertCell();
            var barrierCell = row.insertCell();
            var prizeMoneyCell = row.insertCell();
            var speedCell = row.insertCell();
            var weightCell = row.insertCell();
            var jockeyCell = row.insertCell();

            // var trackWinPercentCell = row.insertCell();
            // var trackPlacePercentCell = row.insertCell();

            var trackDistanceWinPercentCell = row.insertCell();
            var trackDistancePlacePercentCell = row.insertCell();

            // var winPercentCell = row.insertCell();
            // var placePercentCell = row.insertCell();

            var averagePrizeMoneyCell = row.insertCell();
            var formCell = row.insertCell();

            var steveCoPointsCell = row.insertCell();
            pointsCellArray.push(steveCoPointsCell);

            var commentCell = row.insertCell();
            commentCellArray.push(commentCell);
            // runner info
            var name = runner.Name;
            var age = runner.Age;
            var sex = runner.Sex;
            var barrier = runner.Barrier;
            var saddleNumber = runner.SaddleNumber;

            nameCell.innerHTML = runner.Name;
            ageCell.innerHTML = runner.Age;
            saddleNumberCell.innerHTML = saddleNumber;
            barrierCell.innerHTML = barrier;
            prizeMoneyCell.innerHTML = Math.round(runner.PrizeMoneyWon);
            speedCell.innerHTML = runner.SpeedMap.Speed;
            weightCell.innerHTML = runner.totalWeight;
            jockeyCell.innerHTML = runner.Jockey.Name;

            // trackWinPercentCell.innerHTML = trackPerformanceWinPercentage;
            // trackPlacePercentCell.innerHTML = trackPerformancePlacePercentage;

            // trackDistanceWinPercentCell.innerHTML = trackDistanceWinPercentage;
            // trackDistancePlacePercentCell.innerHTML = trackDistancePlacePercentage;

            // winPercentCell.innerHTML = winPercentage;
            // placePercentCell.innerHTML = placePercentage;
            var averagePrizeMoney = 0;
            if (!isNaN(runner.PrizeMoneyWon) && runner.stats.allPerformance.starts != 0) {
                averagePrizeMoney = Math.round(
                    runner.PrizeMoneyWon / runner.stats.allPerformance.starts
                );
            }
            averagePrizeArray.push({ "runner": runner.Name, "averagePrizeMoney": averagePrizeMoney });
            averageOnlyPrizeArray.push(Math.round(averagePrizeMoney));
            averagePrizeMoneyCell.innerHTML = Math.round(averagePrizeMoney);

            // MARK: Points calculation
            var pointBreakdownComment = "";

            var formBonusObject = getFormBonus(
                race,
                runner,
                pointBreakdownComment,
                formCell
            );
            var formBonus = formBonusObject.formBonus;
            pointBreakdownComment = formBonusObject.pointBreakdownComment;
            if (!isNaN(averagePrizeMoney)) {
                totalPrizePool += Math.round(averagePrizeMoney);
            }

            var bonus = 0;
            var speedBarrierBonus = 0;
            var speedDistanceBonus = 0;
            var trackDistanceBonus = 0;;
            var ageBonus = 0;
            var conditionBonus = 0;
            var barrierBonus = 0;
            var weightBonus = 0;
            var numberOfHorseBonus = 0;
            // Track Distance Bonus
            var trackAndTrackDistanceBonusObject = getTrackAndTrackDistanceBonus(race, runner, pointBreakdownComment);
            trackDistanceBonus = trackAndTrackDistanceBonusObject.points;
            pointBreakdownComment = trackAndTrackDistanceBonusObject.pointBreakdownComment;

            // Barrier Bonus
            var barrierBonusObject = getBarrierBonus(race, runner, pointBreakdownComment);
            barrierBonus = barrierBonusObject.points;
            pointBreakdownComment = barrierBonusObject.pointBreakdownComment;

            if (race.Distance <= 1000) {
                speedDistanceBonus = Number(runner.SpeedMap.Speed);
                pointBreakdownComment +=
                    "-Speed/Distance points " + speedDistanceBonus + " <br/>";
            }

            // if (runner.Age >= 4 < 7) {
            //     ageBonus += 3;
            //     pointBreakdownComment += "-Age 4-6, points " + ageBonus + " <br/>";
            // } else if (runner.Age >= 3 && runner.Age < 8) {
            //     ageBonus += 1;
            //     pointBreakdownComment += "-Age 3 or 7, points " + ageBonus + " <br/>";
            // } else {
            //     ageBonus -= 3;
            //     pointBreakdownComment +=
            //         "-Age less than 3 or more than 7, points " + ageBonus + " <br/>";
            // }

            // Weight Bonus
            var weightObject = {};
            var weightBonusObject = getWeightBonus(race, runner, highestWeight, lowestWeight, pointBreakdownComment);
            weightBonus = weightBonusObject.points;
            pointBreakdownComment = weightBonusObject.pointBreakdownComment;

            // Number of horses bonus
            // var numberOfHorseBonusObject = getNumberOfHorseBonus(race, runner, pointBreakdownComment);
            // numberOfHorseBonus = numberOfHorseBonusObject.points;
            // pointBreakdownComment = numberOfHorseBonusObject.pointBreakdownComment;

            // Track Condition Bonus
            var trackConditionBonusObject = getTrackConditionBonus(race, runner, pointBreakdownComment);
            conditionBonus = trackConditionBonusObject.points;
            pointBreakdownComment = trackConditionBonusObject.pointBreakdownComment;


            if (WITH_JOCK) {
                var jockeyBonus = getJockeyPoints(runner.Jockey.Name);
                // jockeyBonus *= 3;
                pointBreakdownComment += "-Jockey points " + jockeyBonus + " <br/>";
                bonus =
                    speedBarrierBonus +
                    speedDistanceBonus +
                    trackDistanceBonus +
                    conditionBonus +
                    formBonus +
                    ageBonus +
                    barrierBonus +
                    weightBonus +
                    numberOfHorseBonus;
                bonus += jockeyBonus;
            } else {
                bonus =
                    speedBarrierBonus +
                    speedDistanceBonus +
                    trackDistanceBonus +
                    conditionBonus +
                    formBonus +
                    ageBonus +
                    barrierBonus +
                    weightBonus +
                    numberOfHorseBonus;
            }
            logger("Bonus = " + bonus);
            // var totalPoints = bonus + penalty;
            steveCoPointsCell.innerHTML = bonus;
            pointBreakdownComentArray.push(pointBreakdownComment);
        }
    });
    var finalPoints = 0;

    var highestPrizeMoney = Math.max(...averageOnlyPrizeArray);
    var lowestPrizeMoney = Math.min(...averageOnlyPrizeArray);

    // Average Prize money accounts for 20% total = 200 points, whoever has highest prize will get 200p
    var totalPointsFromPrizePool = 200 * availableRunners.length;

    availableRunners.forEach(function (runner, runnerIndex) {
        averagePrizeArray.forEach(function (object, prizeIndex) {
            if (object.runner == runner.Name) {
                var points = Number(pointsCellArray[runnerIndex].innerHTML);
                if (!isNaN(object.averagePrizeMoney)) {
                    var pointsForPrize = Math.round(
                        ((object.averagePrizeMoney - lowestPrizeMoney) / (highestPrizeMoney - lowestPrizeMoney)) * 200
                    );
                    logger("horseIndex: " + runnerIndex);
                    logger("points: " + points + " || prize bonus: " + pointsForPrize);
                    logger("total: " + Number(points + pointsForPrize));
                    finalPoints = Math.round(Number(points + pointsForPrize));

                    pointBreakdownComentArray[runnerIndex] +=
                        "-Average Prize, points " + pointsForPrize + " <br/>";

                } else {
                    finalPoints = Math.round(Number(points));
                }
                pointsCellArray[runnerIndex].innerHTML = finalPoints;
                pointBreakdownComentArray[runnerIndex] +=
                    "-Total points =  " + finalPoints + " <br/>";
                commentCellArray[runnerIndex].innerHTML +=
                    pointBreakdownComentArray[runnerIndex];
            }
        });
    });

    // sort table by points
    sortTable(12);
    sortTable(12);
    var table, rows, i, x = 0;
    table = document.getElementById("horses_table");
    rows = table.rows;
    var recommended = "";
    var danger = "";
    var length = rows.length - 1;
    danger = rows[length].getElementsByTagName("TD")[1];
    if (length > 5) {
        length = 5;
    }
    for (i = 1; i <= length; i++) {
        x = rows[i].getElementsByTagName("TD")[1];
        if (i == 1) {
            recommended += "" + x.innerHTML;
        } else {
            recommended += ", " + x.innerHTML;
        }
    }
    document.getElementById("recommended_winners").innerHTML =
        "Recommended: " + recommended;

    document.getElementById("danger").innerHTML =
        "Danger: " + danger.innerHTML;

}

// Calculate track, distance and track distance bonus, this should account for 20 percent total, = 200 points, track = 30, distance = 70 track distance = 100
function getTrackAndTrackDistanceBonus(race, runner, pointBreakdownComment) {
    var trackPerformanceWinPercentage = 0;
    var trackPerformancePlacePercentage = 0;
    var distancePerformanceWinPercentage = 0;
    var distancePerformancePlacePercentage = 0;
    var trackDistanceWinPercentage = 0;
    var trackDistancePlacePercentage = 0;
    if (runner.stats.allPerformance.starts <= 3) { // only count if runner has more than 3 runs
        var result = { "points": 0, "pointBreakdownComment": pointBreakdownComment };
        return result;
    }
    if (runner.stats.trackPerformance.hasStarts) {
        trackPerformanceWinPercentage = Math.round(
            (runner.stats.trackPerformance.wins /
                runner.stats.trackPerformance.starts) *
            100
        );
        trackPerformancePlacePercentage = Math.round(
            ((runner.stats.trackPerformance.wins +
                runner.stats.trackPerformance.seconds +
                runner.stats.trackPerformance.thirds) /
                runner.stats.trackPerformance.starts) *
            100
        );
    }

    if (runner.stats.distancePerformance.hasStarts) {
        distancePerformanceWinPercentage = Math.round(
            (runner.stats.distancePerformance.wins /
                runner.stats.distancePerformance.starts) *
            100
        );
        distancePerformancePlacePercentage = Math.round(
            ((runner.stats.distancePerformance.wins +
                runner.stats.distancePerformance.seconds +
                runner.stats.distancePerformance.thirds) /
                runner.stats.distancePerformance.starts) *
            100
        );
    }

    if (runner.stats.trackAndDistancePerformance.hasStarts) {
        trackDistanceWinPercentage = Math.round(
            (runner.stats.trackAndDistancePerformance.wins /
                runner.stats.trackAndDistancePerformance.starts) *
            100
        );
        trackDistancePlacePercentage = Math.round(
            ((runner.stats.trackAndDistancePerformance.wins +
                runner.stats.trackAndDistancePerformance.seconds +
                runner.stats.trackAndDistancePerformance.thirds) /
                runner.stats.trackAndDistancePerformance.starts) *
            100
        );
    }


    var winPercentage = runner.stats.winPercent;
    var placePercentage = runner.stats.placePercent;

    var trackBonus = 0;
    var distanceBonus = 0;
    var trackDistanceBonus = 0;

    if (runner.stats.trackPerformance.hasStarts) {
        if (runner.stats.trackPerformance.starts >= 2) {
            if (trackPerformancePlacePercentage > 0) {
                trackBonus += 5; // +5 for having race on this track
                trackBonus += Math.round(trackPerformancePlacePercentage * 10 / 100); // 10 points for 100% place
                trackBonus += Math.round(trackPerformanceWinPercentage * 15 / 100); // 15 points for 100% win
                if(trackPerformanceWinPercentage != 0){
                    trackBonus += Math.round(trackPerformanceWinPercentage * 15 / 100);
                } else { // never win before
                    if(runner.stats.trackPerformance.starts >= 3){
                        trackBonus -= (15 + Math.round((100 - trackPerformancePlacePercentage) * 10 / 100));
                    }
                }
            } 
        }
    } else {
        trackBonus -= 15;
    }
    pointBreakdownComment +=
        "-Track perfomance points " + trackBonus + " <br/>";

    if (runner.stats.distancePerformance.hasStarts) {
        if (runner.stats.distancePerformance.starts >= 2) {
            if (distancePerformancePlacePercentage > 0) {
                distanceBonus += 10; // +10 for having race on this distance
                distanceBonus += Math.round(distancePerformancePlacePercentage * 20 / 100); // 20 points for 100% place
                if(distancePerformanceWinPercentage != 0){
                    distanceBonus += Math.round(distancePerformanceWinPercentage * 40 / 100); // 30 points for 100% win
                } else {
                    if(runner.stats.distancePerformance.starts >= 3){
                        distanceBonus -= (30 + Math.round((100 - distancePerformancePlacePercentage) * 20 / 100));
                    }
                }
            } 
        }
    } else {
        distanceBonus -= 30;
    }
    pointBreakdownComment +=
        "-Distance perfomance points " + distanceBonus + " <br/>";

    if (runner.stats.trackAndDistancePerformance.hasStarts) {
        if (runner.stats.trackAndDistancePerformance.starts >= 2) {
            if (trackDistancePlacePercentage > 0) {
                trackDistanceBonus += 15; // +15 for having race on this track/distance
                trackDistanceBonus += Math.round(trackDistancePlacePercentage * 35 / 100); // 35 points for 100% place
                
                if(trackDistanceWinPercentage != 0){
                    trackDistanceBonus += Math.round(trackDistanceWinPercentage * 50 / 100); // 50 points for 100% win
                } else {
                    if(runner.stats.trackAndDistancePerformance.starts >= 3){
                        trackDistanceBonus -= (50 + Math.round((100 - trackDistancePlacePercentage) * 50 / 100) );
                    }
                }
            } 
        }
    } else {
        trackDistanceBonus -= 50;
    }
    pointBreakdownComment +=
        "-T/D perfomance points " + trackDistanceBonus + " <br/>";

    var result = { "points": trackBonus + distanceBonus + trackDistanceBonus, "pointBreakdownComment": pointBreakdownComment };
    return result;
}

// Barrier bonus accounts for 5% total points = 50 points
function getBarrierBonus(race, runner, pointBreakdownComment) {
    var barrierBonus = 0;

    if (runner.Barrier >= 1 && runner.Barrier <= 5) {
        barrierBonus += 35;
        pointBreakdownComment +=
            "-Barrier points " + barrierBonus + " <br/>";
    } else if (runner.Barrier >= 5 && runner.Barrier <= 8) {
        barrierBonus += 15;
        pointBreakdownComment +=
            "-Barrier points " + barrierBonus + " <br/>";
    } else if (runner.Barrier > 20) {
        barrierBonus -= 35;
        pointBreakdownComment +=
            "-Barrier points " + barrierBonus + " <br/>";
    } else if (runner.Barrier > 15) {
        barrierBonus -= 15;
        pointBreakdownComment +=
            "-Barrier points " + barrierBonus + " <br/>";
    }

    var result = { "points": barrierBonus, "pointBreakdownComment": pointBreakdownComment };
    return result;
}

// Barrier bonus accounts for 20% total points = 200 points
function getWeightBonus(race, runner, highestWeight, lowestWeight, pointBreakdownComment) {
    var weightBonus = 0;

    // if (runner.Weight.Total < 55) {
    //     weightBonus += ((55 - Number(runner.Weight.Total)) * 40);
    //     pointBreakdownComment += "-Weight points " + weightBonus + " <br/>";
    // }

    // if (runner.Weight.Total > 55) {
    //     weightBonus += ((55 - Number(runner.Weight.Total)) * 40);
    //     pointBreakdownComment += "-Weight points " + weightBonus + " <br/>";
    // }
    var weightDifference = highestWeight - lowestWeight;
    if (runner.Weight.Total != highestWeight && weightDifference != 0) {
        weightBonus = Math.round(Number((highestWeight - runner.Weight.Total) / weightDifference) * 100);
    }
    pointBreakdownComment += "-Weight points " + weightBonus + " <br/>";
    var result = { "points": weightBonus, "pointBreakdownComment": pointBreakdownComment };
    return result;
}

// Barrier bonus accounts for 15% total points = 150 points
function getNumberOfHorseBonus(race, runner, pointBreakdownComment) {
    var numberOfHorseBonus = 0;
    // pointBreakdownComment += "-Number of horses points " + numberOfHorseBonus + " <br/>";
    var result = { "points": numberOfHorseBonus, "pointBreakdownComment": pointBreakdownComment };
    return result;
}

// Track Condition bonus accounts for 10% total points = 100 points
function getTrackConditionBonus(race, runner, pointBreakdownComment) {
    var trackConditionBonus = 0;
    var winPercentage = 0;
    var placePercentage = 0;
    var hasStart = false;

    if (race.Meeting.TrackCondition.toLowerCase().includes("soft") && runner.stats.softPerformance.hasStarts) {
        hasStart = true;
        winPercentage = Number(runner.stats.softPerformance.wins) / Number(runner.stats.softPerformance.starts);
        placePercentage = (Number(runner.stats.softPerformance.wins) + Number(runner.stats.softPerformance.seconds) + Number(runner.stats.softPerformance.thirds)) / Number(runner.stats.softPerformance.starts);
    } else if (race.Meeting.TrackCondition.toLowerCase().includes("good") && runner.stats.goodNewPerformance.hasStarts) {
        hasStart = true;
        winPercentage = Number(runner.stats.goodNewPerformance.wins) / Number(runner.stats.goodNewPerformance.starts);
        placePercentage = (Number(runner.stats.goodNewPerformance.wins) + Number(runner.stats.goodNewPerformance.seconds) + Number(runner.stats.goodNewPerformance.thirds)) / Number(runner.stats.goodNewPerformance.starts);
    } else if (race.Meeting.TrackCondition.toLowerCase().includes("heavy") && runner.stats.heavyNewPerformance.hasStarts) {
        hasStart = true;
        winPercentage = Number(runner.stats.heavyNewPerformance.wins) / Number(runner.stats.heavyNewPerformance.starts);
        placePercentage = (Number(runner.stats.heavyNewPerformance.wins) + Number(runner.stats.heavyNewPerformance.seconds) + Number(runner.stats.heavyNewPerformance.thirds)) / Number(runner.stats.heavyNewPerformance.starts);
    } else if (race.Meeting.TrackCondition.toLowerCase().includes("synthetic") && runner.stats.syntheticPerformance.hasStarts) {
        hasStart = true;
        winPercentage = Number(runner.stats.syntheticPerformance.wins) / Number(runner.stats.syntheticPerformance.starts);
        placePercentage = (Number(runner.stats.syntheticPerformance.wins) + Number(runner.stats.syntheticPerformance.seconds) + Number(runner.stats.syntheticPerformance.thirds)) / Number(runner.stats.syntheticPerformance.starts);
    }

    if (hasStart) { // has run under this condition before
        if ((placePercentage > 0)) {
            trackConditionBonus += 15; // +15 for having race on this track/distance
            trackConditionBonus += Math.round(placePercentage * 35); // 35 points for 100% place
            trackConditionBonus += Math.round(winPercentage * 50); // 50 points for 100% win
        } else {
            trackConditionBonus -= 15;
        }
    }

    pointBreakdownComment += "-Condition points " + trackConditionBonus + " <br/>";

    var result = { "points": trackConditionBonus, "pointBreakdownComment": pointBreakdownComment };
    return result;
}

function compareRunnerByPrizeMoney(a, b) {
    if (a.averagePrizeMoney < b.averagePrizeMoney) {
        return -1;
    }
    if (a.averagePrizeMoney > b.averagePrizeMoney) {
        return 1;
    }
    return 0;
}

function compareRunnerByWeight(a, b) {
    if (a.Weight.Total < b.Weight.Total) {
        return -1;
    }
    if (a.Weight.Total > b.Weight.Total) {
        return 1;
    }
    return 0;
}

// Form bonus accounts for 10% = 100p
function getFormBonus(race, runner, pointBreakdownComment, formCell) {
    var returnObject = {};
    var totalPoints = 0;
    var pointPool = 0;
    var formBonus = 0;

    var lastStartBonus = 0;
    var familiarJockeyBonus = 0;
    var familiarBarrierBonus = 0;
    var familiarDistanceBonus = 0;
    var nearlyWinBonus = 0;
    var winTooClosePenalty = 0;
    var loseTooFarPenalty = 0;
    var bigPrizeBonus = 0;
    var nearlyWin = 0;
    var winBonus = 0;
    var outOfPlacing = 0;
    var bigWinBonus = 0;
    var sameRacePrevious = 0;
    var brokeMaiden = 0;
    var lowOddCouldntWin = 0;
    var shouldCountSpecial = true;
    var specialFinish = 0;
    var specialFinishPoints = 0;
    var numberOfHorseBonus = 0;
    var badFormSince100dSpellPoints = 0;
    var badFormSince100dSpellCount = 0;
    var limitBadForm = 180
    // This is to include outOfPlacings for old records
    var isLastStartFarAway = false;

    runner.PreviousForm.forEach(function (form, formIndex) {

        if (form.Finish >= 4 && form.Finish <= 7) {
            specialFinish++;
        } else {
            if (formIndex == 0 || formIndex == 1) { //streak wont count if the runner won recently
                shouldCountSpecial = false;
            }
            if (specialFinish < 3) {
                specialFinish = 0;
            }
        }
        // Last start too far
        if (formIndex == 0 && daysToToday(form.Date) > 90) {
            lastStartBonus -= 10;
            pointPool += 10;
            isLastStartFarAway = true;
            limitBadForm = 300
        }

        if(isLastStartFarAway && form.Finish >= 4 && daysToToday(form.Date) < limitBadForm){
            badFormSince100dSpellCount++;
        }

        if(isLastStartFarAway && form.Finish <= 3 && daysToToday(form.Date) < limitBadForm && badFormSince100dSpellCount < 3){
            badFormSince100dSpellCount = 0; // reset bad form
        }

        // Number of horse bonus
        if (form.Finish == 1 && (form.NumberOfRunners == race.NumberOfRunners)) {
            numberOfHorseBonus += 15;
        } else if (form.Finish == 2 && (form.NumberOfRunners == race.NumberOfRunners)) {
            numberOfHorseBonus += 10;
        } else if (form.Finish == 3 && (form.NumberOfRunners == race.NumberOfRunners)) {
            numberOfHorseBonus += 5;
        }
        pointPool += 15;
        // ignore data > 3 months
        // if (daysToToday(form.Date) <= 90) {
        if (form.Finish <= 3) {
            if (runner.Jockey.Name.toLowerCase() == form.Jockey.toLowerCase()) {
                familiarJockeyBonus += 5;
            }
            pointPool += 5;
            if (runner.Barrier == form.Barrier) {
                familiarBarrierBonus += 10;
            } else if (
                runner.Barrier == form.Barrier + 1 ||
                runner.Barrier == form.Barrier - 1
            ) {
                familiarBarrierBonus += 5;
            }
            pointPool += 10;
            if (race.Distance == form.Distance) {
                familiarDistanceBonus += 5;

            }
            pointPool += 5;
            if (form.Finish != 1 && Number(form.StartingPrice) > 30) {
                if(Number(form.Margin) < 1.5) {
                    nearlyWinBonus += 10;
                    pointPool += 10;
                } else if (Number(form.Margin < 0.5)){
                    nearlyWinBonus += 20;
                    pointPool += 20;
                }
                
            }
            if (form.Finish != 1 && form.Margin <= 0.3) {
                nearlyWin = 10;

            } else if (form.Finish != 1 && form.Margin <= 0.5) {
                nearlyWin = 5;
            }
            pointPool += 10;
            if (form.RacePrizeMoney > 5000000) {
                bigPrizeBonus += 15;
                pointPool += 15;
            } else if (form.RacePrizeMoney > 3000000) {
                bigPrizeBonus += 13;
                pointPool += 13;
            } else if (form.RacePrizeMoney > 1000000) {
                bigPrizeBonus += 10;
                pointPool += 10;
            } else if (form.RacePrizeMoney > 800000) {
                bigPrizeBonus += 9;
                pointPool += 9;
            } else if (form.RacePrizeMoney > 500000) {
                bigPrizeBonus += 7;
                pointPool += 7;
            } else if (form.RacePrizeMoney > 200000) {
                bigPrizeBonus += 5;
                pointPool += 5;
            } else if (form.RacePrizeMoney > 100000) {
                bigPrizeBonus += 4;
                pointPool += 4;
            } else if (form.RacePrizeMoney > 70000) {
                bigPrizeBonus += 3;
                pointPool += 3;
            } else if (form.RacePrizeMoney > 50000) {
                bigPrizeBonus += 2;
                pointPool += 2;
            } else if (form.RacePrizeMoney > 20000) {
                bigPrizeBonus += 1;
                pointPool += 1;
            }
        }

        if (form.Finish == 1) {
            winBonus += 10;
            pointPool += 10;
        } else if (form.Finish == 2) {
            winBonus += 6;
            pointPool += 10;
        } else if (form.Finish == 3) {
            winBonus += 3;
            pointPool += 10;
        }
        else {
            if (daysToToday(form.Date) <= 180 || isLastStartFarAway) {
                // couldn't win
                if (Number(form.Margin) >= 20) {
                    // Gave up dont count
                }
                else if (Number(form.Margin) > 5 && form.StartingPrice < 30) {
                    // ignore last runs with high starting price
                    outOfPlacing -= 10;
                    pointPool += 10;

                } else if (Number(form.Margin) >= 3 && form.StartingPrice < 10) {
                    outOfPlacing -= 5;
                    pointPool += 5;
                }
            }
        }

        /* =========== Penalty ============ */
        // 1. very risky to win too closely 

        if (form.Finish == 1) {
            if (Number(form.Margin) > 3.5 && formIndex == 0) {
                bigWinBonus += 20;
                pointPool += 20; // big win bonus
            } else if (Number(form.Margin) <= 0.1 && form.StartingPrice <= 2) {
                winTooClosePenalty -= 10;
                pointPool += 10;
            } else if (Number(form.Margin) <= 0.2 && form.StartingPrice <= 4) {
                winTooClosePenalty -= 5;
                pointPool += 5;
            }
        }
        if (formIndex == 0) {

            // 2. just won the same race previously 
            if (form.Finish == 1 && form.Track == race.Meeting.Track && form.Distance == race.Distance) {
                sameRacePrevious -= 10;
                pointPool += 10; // same race previous close
            }

            // 4. Last start broke maiden
            if (form.Finish == 1 && form.RaceClass.toLowerCase().includes("mdn")) {
                brokeMaiden -= 10;
                pointPool += 10; // broke maiden previous
            }
        }
        // 5. Low odd but couldn't win
        if (form.Finish != 1 && (Math.abs(form.Distance - race.Distance) <= 150)) {
            if (Number(form.StartingPrice) < 2 && form.Margin >= 0.3) {
                lowOddCouldntWin -= 25;
                pointPool -= lowOddCouldntWin;
            } else if (Number(form.StartingPrice) < 2.5 && form.Margin >= 0.5 && form.Finish >= 3) {
                lowOddCouldntWin -= Math.ceil(22 + (form.Margin-0.5));
                pointPool -= lowOddCouldntWin;
            } else if (Number(form.StartingPrice) < 3 && form.Margin >= 1 && form.Finish >= 3) {
                lowOddCouldntWin -= Math.ceil(20 + (form.Margin-1));
                pointPool -= lowOddCouldntWin;
            } else if (Number(form.StartingPrice) < 3.5 && form.Margin >= 1.5 && form.Finish >= 3) {
                lowOddCouldntWin -= Math.ceil(28 + (form.Margin-1.5));
                pointPool -= lowOddCouldntWin;
            } else if (Number(form.StartingPrice) <= 4 && form.Margin >= 2 && form.Finish >= 4) {
                lowOddCouldntWin -= Math.ceil(15 + (form.Margin-2));
                pointPool -= lowOddCouldntWin;
            } else if (Number(form.StartingPrice) < 4.5 && form.Margin >= 3 && form.Finish >= 3) {
                lowOddCouldntWin -= Math.ceil(13 + (form.Margin-3));
                pointPool -= lowOddCouldntWin;
            } else if (Number(form.StartingPrice) <= 5 && form.Margin >= 5 && form.Finish >= 5) {
                lowOddCouldntWin -= Math.ceil(10 + (form.Margin - 5));
                pointPool -= lowOddCouldntWin;
            }
        }

        if (form.Finish <= 3) {
            var finish = form.Finish;
            var margin = form.Margin;
            var timeRan = 0;
            var timeArray = [];
            var expectedWinTime = "N/A";

            if (form.TimeRan != "N/A") {
                var minute = 0;
                var secondArray = [];
                timeRan = form.TimeRan;
                timeArray = timeRan.split(":");
                if (timeArray.length != 1) {
                    minute = timeArray[0];
                    secondArray = timeArray[1].split(".");
                } else {
                    secondArray = timeArray[0].split(".");
                }

                var second = secondArray[0];
                var mili = secondArray[1];

                var miliToWin = Number(mili);
                // Margin Bonus to time, 0.1L = 3ms
                if (finish != 1) {
                    miliToWin += Number(form.Margin) * 10 * 3;
                }

                logger("000 miliToWin == " + miliToWin);
                //Barrier Bonus to time, 1 Barrier = 33ms
                var barrierDiffirence = Number(runner.Barrier) - Number(form.Barrier);
                miliToWin += Number(barrierDiffirence * 33);
                logger("1111 miliToWin == " + miliToWin);
                // Weight Bonus to time, 1kg = 50ms
                logger("2222 miliToWin == " + miliToWin);
                var weightDifference =
                    Number(runner.Weight.Total) -
                    (Number(form.BodyWeight) + Number(form.WeightCarried));
                logger(
                    "form.BodyWeight = " +
                    form.BodyWeight +
                    "form.WeightCarried = " +
                    form.WeightCarried +
                    "| weight = " +
                    runner.Weight.Total +
                    " | weightDifference = " +
                    weightDifference +
                    " | ADDED = " +
                    Number(weightDifference * 50)
                );

                miliToWin += Number(weightDifference * 50);
                logger("3333 miliToWin == " + miliToWin);

                // Track Condition
                if (race.Distance == 1400) {
                    if (
                        form.TrackCondition.toLowerCase() == "g" &&
                        race.Meeting.TrackCondition.charAt(0).toLowerCase() == "h"
                    ) {
                        miliToWin += 400;
                    } else if (
                        form.TrackCondition.toLowerCase() == "h" &&
                        race.Meeting.TrackCondition.charAt(0).toLowerCase() == "g"
                    ) {
                        miliToWin -= 400;
                    }
                }

                var secondToWin = Math.floor(miliToWin / 100);

                if (miliToWin < 0) {
                    miliToWin = 100 + (miliToWin % 100);
                }

                var remainingMiliToWin = miliToWin % 100;
                second = Number(second) + Number(secondToWin);
                mili = Number(remainingMiliToWin);
                if (second > 60) {
                    minute = Number(minute) + Math.floor(second / 60);
                }
                second = second % 60;

                expectedWinTime = minute + ":" + second + "." + mili;
                logger(
                    "minute = " +
                    timeArray[0] +
                    " second = " +
                    second +
                    " mili = " +
                    remainingMiliToWin
                );
            }
            var formInfo = "";
            formInfo += "-Days since: <b>" + daysToToday(form.Date) + "</b>";
            if (form.Distance == race.Distance) {
                formInfo += "<br/>-<b>Distance: " + form.Distance + "</b>";
            } else {
                formInfo += "<br/>-Distance: " + form.Distance;
            }

            if (form.TrackCondition == race.Meeting.TrackCondition.charAt(0)) {
                formInfo += "<br/>-<b>Condition: " + form.TrackCondition + "</b>";
            } else {
                formInfo += "<br/>-Condition: " + form.TrackCondition;
            }
            
            if (form.Barrier == runner.Barrier) {
                formInfo += "<br/>-<b>Barrier: " + form.Barrier + "</b>";
            } else {
                formInfo += "<br/>-Barrier: " + form.Barrier;
            }
            formInfo +=
                "</br>-In run: " +
                form.InRun +
                "<br/>-Finish: " +
                finish +
                "/" +
                form.NumberOfRunners +
                "<br/>-Time: " +
                timeRan +
                
                "</br>-Expected Time: " +
                expectedWinTime +
                "<br/>-Margin: " +
                margin +
                "<br/>----------------<br/>";
            formCell.innerHTML += formInfo;
        }

        // }
        // pointPool += 10; // last start
        // pointPool += 5; // same jock
        // pointPool += 20; // same barrier
        // pointPool += 5; // same distance
        // pointPool += 5; // nearly win
        // pointPool += 10; // nearly win
        // pointPool += 15; // big prize
        // pointPool += 10; // win bonus
        // pointPool += 0; // big win bonus
        // pointPool += 0; // big too close
    });

    if(badFormSince100dSpellCount >= 3){
        badFormSince100dSpellPoints -= 20;
        pointPool += 20;
    }

    if (shouldCountSpecial) {
        if (specialFinish >= 4) {
            specialFinishPoints += 20;
            pointPool += 20;
        } else if (specialFinish >= 3) {
            specialFinishPoints += 10;
            pointPool += 10;
        }
        // if in special streak, ignore out of placing, ignore bad form
        if(outOfPlacing !=  0){
            pointPool += outOfPlacing; // return point pool
            outOfPlacing = 0;
        }

        if(badFormSince100dSpellPoints !=  0){
            pointPool += badFormSince100dSpellPoints; // return point pool
            badFormSince100dSpellPoints = 0;
        }
    }

    

    totalPoints = lastStartBonus +
        familiarJockeyBonus +
        familiarBarrierBonus +
        familiarDistanceBonus +
        nearlyWinBonus +
        winTooClosePenalty +
        loseTooFarPenalty +
        bigPrizeBonus +
        nearlyWin +
        winBonus +
        bigWinBonus +
        sameRacePrevious +
        brokeMaiden +
        lowOddCouldntWin +
        outOfPlacing +
        specialFinish +
        badFormSince100dSpellPoints;
    // pointBreakdownComment += "-- SPECIAL POINTS --<br/>";
    if (lastStartBonus != 0) {
        pointBreakdownComment += "-Last start is too far, " + Math.round(lastStartBonus / pointPool * 200) + "<br/>";
    }

    if (familiarJockeyBonus != 0) {
        pointBreakdownComment += "-Same jockey points " + Math.round(familiarJockeyBonus / pointPool * 200) + "<br/>";
    }

    if (familiarBarrierBonus != 0) {
        pointBreakdownComment += "-Same barrier points " + Math.round(familiarBarrierBonus / pointPool * 200) + "<br/>";
    }

    if (familiarDistanceBonus != 0) {
        pointBreakdownComment += "-Same distance points " + Math.round(familiarDistanceBonus / pointPool * 200) + "<br/>";
    }

    if (nearlyWinBonus != 0) {
        pointBreakdownComment += "-Nearly Win with big odd points " + Math.round(nearlyWinBonus / pointPool * 200) + "<br/>";
    }

    if (winTooClosePenalty != 0) {
        pointBreakdownComment += "-Won too close, points " + Math.round(winTooClosePenalty / pointPool * 200) + "<br/>";
    }

    if (loseTooFarPenalty != 0) {
        pointBreakdownComment += "-Lose too far points " + Math.round(loseTooFarPenalty / pointPool * 200) + "<br/>";
    }

    if (nearlyWin != 0) {
        pointBreakdownComment += "-Finished close, points " + Math.round(nearlyWin / pointPool * 200) + "<br/>";
    }

    if (bigPrizeBonus != 0) {
        pointBreakdownComment += "-Race Prize Money, points " + Math.round(bigPrizeBonus / pointPool * 200) + "<br/>";
    }

    if (winBonus != 0) {
        pointBreakdownComment += "-Finished in place, points " + Math.round(winBonus / pointPool * 200) + "<br/>";
    }

    if (bigWinBonus != 0) {
        pointBreakdownComment += "-Last time won like a god, points " + Math.round(bigWinBonus / pointPool * 200) + "<br/>";
    }

    if (sameRacePrevious != 0) {
        pointBreakdownComment += "-Won same race last start, points " + Math.round(sameRacePrevious / pointPool * 200) + "<br/>";
    }

    if (brokeMaiden != 0) {
        pointBreakdownComment += "-Just broke maiden, points " + Math.round(brokeMaiden / pointPool * 200) + "<br/>";
    }

    if (lowOddCouldntWin != 0) {
        pointBreakdownComment += "-Low odd but couldn't win, points " + Math.round(lowOddCouldntWin / pointPool * 200) + "<br/>";
    }

    if (outOfPlacing != 0) {
        if(specialFinishPoints == 0){
            pointBreakdownComment += "-Out of placings, points " + Math.round(outOfPlacing / pointPool * 200) + "<br/>";
        }
    }

    if (specialFinishPoints != 0) {
        pointBreakdownComment += "-Special finish streak, points " + Math.round(specialFinishPoints / pointPool * 200) + "<br/>";
    }

    if (badFormSince100dSpellPoints != 0) {
        pointBreakdownComment += "-Since 100 days spell, forms are bad " + Math.round(badFormSince100dSpellPoints / pointPool * 200) + "<br/>";
    }
    // pointBreakdownComment += "------- END SPECIAL POINTS -------<br/>";
    // prize pool = 100 points
    if (pointPool != 0) {
        formBonus = Math.round(totalPoints / pointPool * 200);
    }
    if (Number(runner.stats.winPercent) != 0) {
        formBonus = Math.round(formBonus * (runner.stats.winPercent) / 10);
    } else if(Number(runner.stats.placePercent) != 0){
        formBonus = Math.round(formBonus * (runner.stats.placePercent) / 20);
    }

    if (numberOfHorseBonus != 0) {
        formBonus += Number(numberOfHorseBonus);
    }
    if(formBonus > 0){
        formBonus *= 3
    }
    pointBreakdownComment += "-Form bonus points " + formBonus + "<br/>";
    returnObject = {
        formBonus: formBonus,
        pointBreakdownComment: pointBreakdownComment,
    };
    return returnObject;
}

// My logger
function logger(text) {
    if (ENABLE_LOG == true) {
        console.log(text);
    }
}

function loadJockeysForState(state) {
    var url = "./jockeys.json";
    switch (state.toLowerCase()) {
        case "nsw".toLowerCase():
            url = "./jockeys/nsw.json";
            break;
        case "nt".toLowerCase():
            url = "./jockeys/nt.json";
            break;
        case "qld".toLowerCase():
            url = "./jockeys/qld.json";
            break;
        case "sa".toLowerCase():
            url = "./jockeys/sa.json";
            break;
        case "tas".toLowerCase():
            url = "./jockeys/tas.json";
            break;
        case "vic".toLowerCase():
            url = "./jockeys/vic.json";
            break;
        case "wa".toLowerCase():
            url = "./jockeys/wa.json";
            break;
    }

    console.log("url == " + url);

    return new Promise((resolve, reject) => {
        //here our function should be implemented
        fetch(url)
            .then(response => {
                return response.json();
            })
            .then(jsondata => {
                jockeyList = jsondata
                resolve();
            });
    });
}

// Get bonus points by jockeys, points = 200
function getJockeyPoints(jockey) {

    console.log(
        "Jock = " + jockey.toLowerCase()
    );

    var points = 0;
    if (jockeyList.jockeys === undefined) {
        return 0;
    }
    var reversedJockeys = jockeyList.jockeys;
    // var reversedJockeys = jockeyList.jockeys.reverse();
    reversedJockeys.forEach(function (jockeyName, point) {
        if (jockeyName.toLowerCase() == jockey.toLowerCase()) {
            points = reversedJockeys.length - point;
            // points = (point / reversedJockeys.length) * 200;
        }
    });

    if(points == 0){
        console.log("MISSING JOCK!!!" + jockey.toLowerCase() + " || POINTS = " + points);
    }
    
    return Math.round(points);
}

// SUPPORT
function daysToToday(date) {
    var splittedDate = date.split("/");

    var date1 = new Date(splittedDate[2] + "-" + splittedDate[1] + "-" + splittedDate[0]);
    var date2 = new Date();

    // To calculate the time difference of two dates
    var Difference_In_Time = date2.getTime() - date1.getTime();

    // To calculate the no. of days between two dates
    var differentInDays = Math.round(Difference_In_Time / (1000 * 3600 * 24));

    return differentInDays;
}

function sortTable(n) {
    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    table = document.getElementById("horses_table");
    switching = true;
    // Set the sorting direction to ascending:
    dir = "asc";
    /* Make a loop that will continue until
    no switching has been done: */
    while (switching) {
        // Start by saying: no switching is done:
        switching = false;
        rows = table.rows;
        /* Loop through all table rows (except the
        first, which contains table headers): */
        for (i = 1; i < (rows.length - 1); i++) {
            // Start by saying there should be no switching:
            shouldSwitch = false;
            /* Get the two elements you want to compare,
            one from current row and one from the next: */
            x = rows[i].getElementsByTagName("TD")[n];
            y = rows[i + 1].getElementsByTagName("TD")[n];
            /* Check if the two rows should switch place,
            based on the direction, asc or desc: */
            if (!isNaN(x.innerHTML) && !isNaN(y.innerHTML)) {
                if (dir == "asc") {
                    if (Number(x.innerHTML) > Number(y.innerHTML)) {
                        shouldSwitch = true;
                        break;
                    }

                } else if (dir == "desc") {
                    if (Number(x.innerHTML) < Number(y.innerHTML)) {
                        shouldSwitch = true;
                        break;
                    }

                }

            } else {
                if (dir == "asc") {
                    if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                        // If so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                } else if (dir == "desc") {
                    if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                        // If so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                }
            }
        }
        if (shouldSwitch) {
            /* If a switch has been marked, make the switch
            and mark that a switch has been done: */
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            // Each time a switch is done, increase this count by 1:
            switchcount++;
        } else {
            /* If no switching has been done AND the direction is "asc",
            set the direction to "desc" and run the while loop again. */
            if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
            }
        }
    }
}