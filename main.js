/** @format */

var ENABLE_LOG = false;
var SHOW_JSON = false;

function submitForm() {
    var bypassCORSURL = "https://corsproxy.giadang.com?url=";
    var url = document.getElementById("url").value;
    $.ajax({
        url: bypassCORSURL + url,
        type: "GET",
        success: function(response) {
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
        error: function(xhr, status) {
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
function process_horse(table, race) {
    var state = race.Meeting.State;
    var pointsCellArray = [];
    var averagePrizeArray = [];
    var availableRunners = [];
    var commentCellArray = [];
    var pointBreakdownComentArray = [];
    var totalPrizePool = 0;

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

            var trackPerformanceWinPercentage = Math.round(
                (runner.stats.trackPerformance.wins /
                    runner.stats.trackPerformance.starts) *
                100
            );
            var trackPerformancePlacePercentage = Math.round(
                ((runner.stats.trackPerformance.wins +
                        runner.stats.trackPerformance.seconds) /
                    runner.stats.trackPerformance.starts) *
                100
            );

            var distancePerformanceWinPercentage = Math.round(
                (runner.stats.distancePerformance.wins /
                    runner.stats.distancePerformance.starts) *
                100
            );
            var distancePerformancePlacePercentage = Math.round(
                ((runner.stats.distancePerformance.wins +
                        runner.stats.distancePerformance.seconds) /
                    runner.stats.distancePerformance.starts) *
                100
            );

            var trackDistanceWinPercentage = Math.round(
                (runner.stats.trackAndDistancePerformance.wins /
                    runner.stats.trackAndDistancePerformance.starts) *
                100
            );
            var trackDistancePlacePercentage = Math.round(
                ((runner.stats.trackAndDistancePerformance.wins +
                        runner.stats.trackAndDistancePerformance.seconds) /
                    runner.stats.trackAndDistancePerformance.starts) *
                100
            );

            var winPercentage = runner.stats.winPercent;
            var placePercentage = runner.stats.placePercent;

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

            trackDistanceWinPercentCell.innerHTML = trackDistanceWinPercentage;
            trackDistancePlacePercentCell.innerHTML = trackDistancePlacePercentage;

            // winPercentCell.innerHTML = winPercentage;
            // placePercentCell.innerHTML = placePercentage;
            var averagePrizeMoney = 0;
            if (!isNaN(averagePrizeMoney)) {
                averagePrizeMoney = Math.round(
                    runner.PrizeMoneyWon / runner.stats.allPerformance.starts
                );
                averagePrizeArray.push(averagePrizeMoney);
            }
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
            pointBreakdownComment += formBonusObject.pointBreakdownComment;
            if (!isNaN(averagePrizeMoney)) {
                totalPrizePool += Math.round(averagePrizeMoney);
            }

            // MARK: Logic
            // Bonus on jockeys
            // var jockeyBonus = getJockeyPoints(jockey, state);
            var jockeyBonus = 0;
            pointBreakdownComment += "-Jockey points + " + jockeyBonus + " <br/>";
            var speedBarrierBonus = 0;
            var speedDistanceBonus = 0;
            var trackBonus = 0;
            var distanceBonus = 0;
            var trackDistanceBonus = 0;
            var ageBonus = 0;
            var conditionBonus = 0;
            // Never run this track
            if (isNaN(trackPerformanceWinPercentage) || isNaN(trackPerformancePlacePercentage)) {
                trackBonus -= 3;
            } else if (trackPerformanceWinPercentage == 0) { // Run this track but never win
                trackBonus -= Math.round(trackPerformancePlacePercentage / 10);
            } else {
                trackBonus += Math.round(trackPerformancePlacePercentage / 20);
            }
            pointBreakdownComment +=
                "-Track perfomance points " + trackBonus + " <br/>";
            // Never run this distance
            if (
                isNaN(distancePerformanceWinPercentage) || isNaN(distancePerformancePlacePercentage)) {
                distanceBonus -= 3;
            } else if (distancePerformanceWinPercentage == 0) { // Run this distance but never win
                distanceBonus -= Math.round(distancePerformanceWinPercentage / 10);
            } else {
                distanceBonus += Math.round(distancePerformancePlacePercentage / 20);
            }
            pointBreakdownComment +=
                "-Distance perfomance points " + distanceBonus + " <br/>";
            // Never run this T/D
            if (
                isNaN(trackDistanceWinPercentage) || isNaN(trackDistancePlacePercentage)
            ) {
                trackDistanceBonus -= 3;
            } else if (trackDistanceWinPercentage == 0) {
                distanceBonus -= Math.round(trackDistancePlacePercentage / 10); // Run this T/D but never win
            } else {
                trackDistanceBonus += Math.round(trackDistancePlacePercentage / 20);
            }
            pointBreakdownComment +=
                "-T/D perfomance points " + distanceBonus + " <br/>";

            if (barrier < 5) {
                speedBarrierBonus = runner.SpeedMap.Speed - runner.Barrier;
                pointBreakdownComment +=
                    "-Speed/Barrier points " + speedBarrierBonus + " <br/>";
            }

            if (race.Distance <= 1100) {
                speedDistanceBonus = runner.SpeedMap.Speed;
                pointBreakdownComment +=
                    "-Speed/Distance points " + speedDistanceBonus + " <br/>";
            }

            if (runner.Age >= 4 < 7) {
                ageBonus += 3;
                pointBreakdownComment += "-Age 4-6, points " + ageBonus + " <br/>";
            } else if (runner.Age >= 3 && runner.Age < 8) {
                ageBonus += 1;
                pointBreakdownComment += "-Age 3 or 7, points " + ageBonus + " <br/>";
            } else {
                ageBonus -= 3;
                pointBreakdownComment +=
                    "-Age less than 3 or more than 7, points " + ageBonus + " <br/>";
            }
            logger(
                "jockeyBonus: " +
                jockeyBonus +
                " || speedBarrierBonus: " +
                speedBarrierBonus +
                " || speedDistanceBonus: " +
                speedDistanceBonus +
                " || distanceBonus: " +
                distanceBonus +
                " || trackDistanceBonus: " +
                trackDistanceBonus +
                " || formBonus: " +
                formBonus
            );
            var bonus =
                jockeyBonus +
                speedBarrierBonus +
                speedDistanceBonus +
                distanceBonus +
                trackBonus +
                trackDistanceBonus +
                conditionBonus +
                formBonus +
                ageBonus;
            // var totalPoints = bonus + penalty;
            steveCoPointsCell.innerHTML = bonus;
            pointBreakdownComentArray.push(pointBreakdownComment);
        }
    });

    averagePrizeArray.sort((a, b) => a - b);
    var finalPoints = 0;
    var totalPointsFromPrizePool = totalPrizePool / 1000;
    averagePrizeArray.forEach(function(prize, prizeIndex) {
        availableRunners.forEach(function(runner, runnerIndex) {
            if (!isNaN(runner.PrizeMoneyWon)) {
                var averagePrizeMoney = Math.round(
                    runner.PrizeMoneyWon / runner.stats.allPerformance.starts
                );
                if (averagePrizeMoney == prize) {
                    var pointsForPrize = Math.round(
                        (averagePrizeMoney / totalPrizePool) * totalPointsFromPrizePool
                    );
                    logger("horseIndex: " + runnerIndex);
                    var points = Number(pointsCellArray[runnerIndex].innerHTML);
                    logger("points: " + points + " || prize bonus: " + pointsForPrize);
                    logger("total: " + Number(points + pointsForPrize));
                    finalPoints = Number(points + pointsForPrize);
                    pointsCellArray[runnerIndex].innerHTML = finalPoints;
                    pointBreakdownComentArray[runnerIndex] +=
                        "-Average Prize, points " + pointsForPrize + " <br/>";
                    pointBreakdownComentArray[runnerIndex] +=
                        "-Total points =  " + finalPoints + " <br/>";
                    logger("comment = " + pointBreakdownComentArray[runnerIndex]);
                    commentCellArray[runnerIndex].innerHTML =
                        pointBreakdownComentArray[runnerIndex];
                }
            }
        });
    });
}

// Magic Calculating
function getFormBonus(race, runner, pointBreakdownComment, formCell) {
    var returnObject = {};
    var formBonus = 0;
    var specialFinish = 0;
    var lastIndex = 0;

    runner.PreviousForm.forEach(function(form, formIndex) {
        // Last start too far
        if (formIndex == 0 && daysToToday(form.Date) > 90) {
            pointBreakdownComment += "-Last start is too far, " + daysToToday(form.Date) + "days, points -10<br/>";
            formBonus -= 10;
        }
        // ignore data > 3 months
        if (daysToToday(form.Date) <= 90) {
            if (form.Finish >= 4 && form.Finish <= 7) {
                specialFinish++;
            } else {
                specialFinish = 0;
            }

            if (form.Finish <= 3) {
                if (runner.Jockey.Name.toLowerCase() == form.Jockey.toLowerCase()) {
                    formBonus += 5;
                    pointBreakdownComment += "-Same jock points +5<br/>";
                }
                if (runner.Barrier == form.Barrier) {
                    formBonus += 3;
                    pointBreakdownComment += "-Same barrier points +3<br/>";
                } else if (
                    runner.Barrier == form.Barrier + 1 ||
                    runner.Barrier == form.Barrier - 1
                ) {
                    pointBreakdownComment += "-Barrier +-1 points +2<br/>";
                    formBonus += 2;
                } else if (
                    runner.Barrier == form.Barrier + 2 ||
                    runner.Barrier == form.Barrier - 2
                ) {
                    pointBreakdownComment += "-Barrier +-3 points +1<br/>";
                    formBonus += 1;
                } else {
                    pointBreakdownComment += "-Barrier points -3<br/>";
                    formBonus -= 3;
                }

                if (race.Distance == form.Distance) {
                    pointBreakdownComment += "-Same race distance points +5<br/>";
                    formBonus += 5;
                }

                if (Number(form.StartingPrice) > 30 && Number(form.Margin) < 0.5) {
                    pointBreakdownComment += "-Special points +5<br/>";
                    formBonus += 5;
                }

                if (form.Finish != 1) {
                    if (form.Margin >= 15) { // this runner probably gave up, dont count

                    } else if (form.Margin >= 4) {
                        pointBreakdownComment += "-Finished at " + form.Finish + ", but " + form.Margin + "L far away, points -10<br/>";
                        formBonus -= 10; // finished too far away
                    } else if (form.Margin >= 2) {
                        pointBreakdownComment += "-Finished at " + form.Finish + ", but " + form.Margin + "L far away, points -5<br/>";
                        formBonus -= 5; // finished too far away
                    }
                }

                if (form.Finish != 1 && form.Margin <= 0.3) {
                    pointBreakdownComment += "-Finished at " + form.Finish + ", only" + form.Margin + "L far away, points +10<br/>";
                    formBonus += 10; // finished too far away
                }

                if (form.RacePrizeMoney > 5000000) {
                    pointBreakdownComment += "-RacePrizeMoney > 5,000,000 points +15<br/>";
                    formBonus += 15;
                } else if (form.RacePrizeMoney > 3000000) {
                    pointBreakdownComment += "-RacePrizeMoney > 3,000,000 points +13<br/>";
                    formBonus += 13;
                } else if (form.RacePrizeMoney > 1000000) {
                    pointBreakdownComment += "-RacePrizeMoney > 1,000,000 points +10<br/>";
                    formBonus += 10;
                } else if (form.RacePrizeMoney > 800000) {
                    pointBreakdownComment += "-RacePrizeMoney > 800,000 points +9<br/>";
                    formBonus += 9;
                } else if (form.RacePrizeMoney > 500000) {
                    pointBreakdownComment += "-RacePrizeMoney > 500,000 points +7<br/>";
                    formBonus += 7;
                } else if (form.RacePrizeMoney > 200000) {
                    pointBreakdownComment += "-RacePrizeMoney > 200,000 points +5<br/>";
                    formBonus += 5;
                } else if (form.RacePrizeMoney > 100000) {
                    pointBreakdownComment += "-RacePrizeMoney > 100,000 points +4<br/>";
                    formBonus += 4;
                } else if (form.RacePrizeMoney > 70000) {
                    pointBreakdownComment += "-RacePrizeMoney > 75,000 points +3<br/>";
                    formBonus += 3;
                } else if (form.RacePrizeMoney > 50000) {
                    pointBreakdownComment += "-RacePrizeMoney > 50,000 points +2<br/>";
                    formBonus += 2;
                } else if (form.RacePrizeMoney > 20000) {
                    pointBreakdownComment += "-RacePrizeMoney > 50,000 points +1<br/>";
                    formBonus += 1;
                }


            }

            console.log("Runner " + runner.Name + " form.Finish = " + form.Finish + " out of " + form.NumberOfRunners);

            if (form.Finish == 1) {
                pointBreakdownComment += "-Finished 1st points +5<br/>";
                formBonus += 5;
            } else if (form.Finish == 2) {
                pointBreakdownComment += "-Finished 2nd points +3<br/>";
                formBonus += 3;
            } else if (form.Finish == 3) {
                pointBreakdownComment += "-Finished 3rd points +1<br/>";
                formBonus += 1;
            } else if (form.Finish == form.NumberOfRunners) {
                pointBreakdownComment += "-Finished last points -5<br/>";
                formBonus -= 5;
            } else if (form.Finish > form.NumberOfRunners / 2) {
                pointBreakdownComment += "-Finished > 1/2 runners points -3 <br/>";
                formBonus -= 3;
            } else if (form.Finish > form.NumberOfRunners / 3) {
                pointBreakdownComment += "-Finished > 1/3 runners points -1 <br/>";
                formBonus -= 1;
            }

            /* =========== Penalty ============ */
            // 1. very risky to win too closely 
            if (form.Finish == 1) {
                if (form.Margin <= 0.1) {
                    pointBreakdownComment += "-Won too close points -10 <br/>";
                    formBonus -= 10;
                } else if (form.Margin <= 0.2) {
                    pointBreakdownComment += "-Won too close points -5 <br/>";
                    formBonus -= 5;
                }

            }
            // 2. just won the same race previously 
            if (form.Finish == 1 && formIndex == 0 && form.Track == race.Meeting.Track && form.Distance == race.Distance) {
                pointBreakdownComment += "-Won same race last start -5 <br/>";
                formBonus -= 5;
            }

            // 4. Last start broke maiden
            if (form.Finish == 1 && formIndex == 0 && form.RaceClass.toLowerCase().includes("mdn")) {
                pointBreakdownComment += "-Just broke maiden, points -10<br/>";
                formBonus -= 10;
            }

            var formDistance = form.Distance;
            if (form.Finish <= 3) {
                var finish = form.Finish;
                var margin = form.Margin;
                var timeRan = 0;
                var timeArray = [];
                var expectedWinTime = "N/A";

                if (form.TrackCondition == race.Meeting.TrackCondition.charAt(0)) {
                    conditionBonus = 5;
                    pointBreakdownComment +=
                        "-Condition points " + conditionBonus + " <br/>";
                }

                if (form.TimeRan != "N/A") {
                    timeRan = form.TimeRan;
                    timeArray = timeRan.split(":");
                    var minute = timeArray[0];
                    var secondArray = timeArray[1].split(".");
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
                formInfo +=
                    "<br/>-Finish: " +
                    finish +
                    "/" +
                    form.NumberOfRunners +
                    "<br/>-Time: " +
                    timeRan +
                    "</br>-In run: " +
                    form.InRun +
                    "</br>-Expected Time: " +
                    expectedWinTime +
                    "<br/>-Margin: " +
                    margin +
                    "<br/>----------------<br/>";
                formCell.innerHTML += formInfo;
            }
            pointBreakdownComment += "------------------ <br/>";

        }
    });
    if (specialFinish >= 4) {
        formBonus += 10;
        pointBreakdownComment += "-Special finish streak points +10<br/>";
    }

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

// Get bonus points by jockeys
function getJockeyPoints(jockey, state) {
    logger(
        "Jock = " + jockey.toLowerCase() + " | State = " + state.toLowerCase()
    );
    switch (state.toLowerCase()) {
        case "nsw".toLowerCase():
            switch (jockey.toLowerCase()) {
                case "James McDonald".toLowerCase():
                    return 20;
                case "William Pike".toLowerCase():
                    return 20;
                case "Ashley Morgan".toLowerCase():
                    return 19;
                case "Hugh Bowman".toLowerCase():
                    return 18;
                case "James McDonald".toLowerCase():
                    return 17;
                case "Jason Collett".toLowerCase():
                    return 16;
                case "Tommy Berry".toLowerCase():
                    return 15;
                case "Dylan Gibbons".toLowerCase():
                    return 14;
                case "Mathew Cahill".toLowerCase():
                    return 13;
                case "Reece Jones".toLowerCase():
                    return 12;
                case "Grant Buckley".toLowerCase():
                    return 11;
                case "Tim Clark".toLowerCase():
                    return 10;
                case "Winona Costin".toLowerCase():
                    return 9;
                case "Brodie Loy".toLowerCase():
                    return 8;
                case "Ben Looker".toLowerCase():
                    return 7;
                case "Jackson Searle".toLowerCase():
                    return 6;
                case "Jeff Penza".toLowerCase():
                    return 5;
                case "Brooke Stower".toLowerCase():
                    return 4;
                case "Aaron Bullock".toLowerCase():
                    return 3;
                case "Christian Reith".toLowerCase():
                    return 2;
                case "Mikayla Weir".toLowerCase():
                    return 1;
                default:
                    return 0;
            }
            break;

        case "Vic".toLowerCase():
            switch (jockey.toLowerCase()) {
                case "Damian Lane".toLowerCase():
                    return 20;
                case "J Allen".toLowerCase():
                    return 19;
                case "Jye McNeil".toLowerCase():
                    return 18;
                case "Damien Thornton".toLowerCase():
                    return 17;
                case "Jordan Childs".toLowerCase():
                    return 16;
                case "Jason Collett".toLowerCase():
                    return 15;
                case "Jarrod Fry".toLowerCase():
                    return 14;
                case "Craig Newitt".toLowerCase():
                    return 13;
                case "Patrick Moloney".toLowerCase():
                    return 12;
                case "Will Gordon".toLowerCase():
                    return 11;
                case "Zac Spain".toLowerCase():
                    return 10;
                case "Jamie Kah".toLowerCase():
                    return 9;
                case "Damien Oliver".toLowerCase():
                    return 8;
                case "Michael Dee".toLowerCase():
                    return 7;
                case "Beau Mertens".toLowerCase():
                    return 6;
                case "Blaike McDougall".toLowerCase():
                    return 6;
                case "Brett Prebble".toLowerCase():
                    return 5;
                case "Declan Bates".toLowerCase():
                    return 5;
                case "Josh Richards".toLowerCase():
                    return 4;
                case "Jack Hill".toLowerCase():
                    return 3;
                case "Craig Williams".toLowerCase():
                    return 2;
                case "Dean Holland".toLowerCase():
                    return 1;
                default:
                    return 0;
            }
            break;

        case "WA".toLowerCase():
            switch (jockey.toLowerCase()) {
                case "Clint Johnston-Porter".toLowerCase():
                    return 20;
                case "Chris Parnham".toLowerCase():
                    return 19;
                case "Natasha Faithfull".toLowerCase():
                    return 18;
                case "Holly Watson".toLowerCase():
                    return 17;
                case "Brad Rawiller".toLowerCase():
                    return 16;
                case "Shaun O'Donnell".toLowerCase():
                    return 15;
                case "Troy Turner".toLowerCase():
                    return 14;
                case "Joseph Azzopardi".toLowerCase():
                    return 13;
                case "Jason Whiting".toLowerCase():
                    return 12;
                case "Shaun McGruddy".toLowerCase():
                    return 11;
                case "Lucy Warwick".toLowerCase():
                    return 10;
                case "Laqdar Ramoly".toLowerCase():
                    return 9;
                case "Patrick Carbery".toLowerCase():
                    return 8;
                case "Keshaw Dhurun".toLowerCase():
                    return 7;
                case "Brad Parnham".toLowerCase():
                    return 6;
                case "Kyra Yuill".toLowerCase():
                    return 5;
                case "Lisa Staples".toLowerCase():
                    return 4;
                case "Andrew Castle".toLowerCase():
                    return 3;
                case "Jade McNaught".toLowerCase():
                    return 2;
                case "Jordan Turner".toLowerCase():
                    return 1;
                default:
                    return 0;
            }
            break;

        case "SA".toLowerCase():
            switch (jockey.toLowerCase()) {
                case "Kayla Crowther".toLowerCase():
                    return 20;
                case "Barend Vorster".toLowerCase():
                    return 19;
                case "Ben Price".toLowerCase():
                    return 18;
                case "Jake Toeroek".toLowerCase():
                    return 17;
                case "Jason Holder".toLowerCase():
                    return 16;
                case "Angus Chung".toLowerCase():
                    return 15;
                case "Ryan Hurdle".toLowerCase():
                    return 14;
                case "Todd Pannell".toLowerCase():
                    return 13;
                case "Paul Gatt".toLowerCase():
                    return 12;
                case "Dom Tourneur".toLowerCase():
                    return 11;
                case "Justin Potter".toLowerCase():
                    return 10;
                case "Jacob Opperman".toLowerCase():
                    return 9;
                case "Ellis Wong".toLowerCase():
                    return 8;
                case "Karl Zechner".toLowerCase():
                    return 7;
                case "Teagan Voorham".toLowerCase():
                    return 6;
                case "Jessica Eaton".toLowerCase():
                    return 5;
                case "Anna Jordsjo".toLowerCase():
                    return 4;
                case "Sophie Logan".toLowerCase():
                    return 3;
                case "Jeffrey Maund".toLowerCase():
                    return 2;
                case "Stacey Callow".toLowerCase():
                    return 1;
                default:
                    return 0;
            }
            break;
        case "QLD".toLowerCase():
            switch (jockey.toLowerCase()) {
                case "James Orman".toLowerCase():
                    return 20;
                case "Ryan Maloney".toLowerCase():
                    return 19;
                case "Jasmine Cornish".toLowerCase():
                    return 18;
                case "Kyle Wilson-Taylor".toLowerCase():
                    return 17;
                case "Ryan Wiggins".toLowerCase():
                    return 16;
                case "Tahlia Fenlon".toLowerCase():
                    return 15;
                case "Justin Stanley".toLowerCase():
                    return 14;
                case "Lacey Morrison".toLowerCase():
                    return 13;
                case "Angela Jones".toLowerCase():
                    return 12;
                case "Noel Callow".toLowerCase():
                    return 11;
                case "Jim Byrne".toLowerCase():
                    return 10;
                case "Zac Lloyd".toLowerCase():
                    return 9;
                case "Boris Thornton".toLowerCase():
                    return 8;
                case "Jaden Lloyd".toLowerCase():
                    return 7;
                case "Ben Thompson".toLowerCase():
                    return 6;
                case "Tiffani Brooker".toLowerCase():
                    return 5;
                case "Samantha Collett".toLowerCase():
                    return 4;
                case "Nathan Day".toLowerCase():
                    return 3;
                case "Marnu Potgieter".toLowerCase():
                    return 2;
                case "Les Tilley".toLowerCase():
                    return 1;
                default:
                    return 0;
            }
            break;
        default:
            return 0;
    }
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