/** @format */

var ENABLE_LOG = false;
var SHOW_JSON = false;
var WITH_JOCK = false;

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
            var speedBarrierBonus = 0;
            var speedDistanceBonus = 0;
            var trackBonus = 0;
            var distanceBonus = 0;
            var trackDistanceBonus = 0;
            var ageBonus = 0;
            var conditionBonus = 0;
            var barrierBonus = 0;
            // Never run this track
            if (runner.stats.trackPerformance.hasStarts) {
                trackBonus -= 3;
            } else if (runner.stats.trackPerformance.wins == 0) { // Run this track but never win
                trackBonus -= runner.stats.trackPerformance.starts;
            } else {
                trackBonus += Math.round(trackPerformancePlacePercentage / 20);
            }
            pointBreakdownComment +=
                "-Track perfomance points " + trackBonus + " <br/>";
            // // Never run this distance
            if (runner.stats.distancePerformance.hasStarts) {
                distanceBonus -= 3;
            } else if (runner.stats.distancePerformance.wins == 0) { // Run this distance but never win
                distanceBonus -= runner.stats.distancePerformance.starts;
            } else {
                distanceBonus += Math.round(distancePerformancePlacePercentage / 20);
            }
            pointBreakdownComment +=
                "-Distance perfomance points " + distanceBonus + " <br/>";
            // Never run this T/D
            if (runner.stats.trackAndDistancePerformance.hasStarts) {
                trackDistanceBonus -= 3;
            } else if (runner.stats.trackAndDistancePerformance.wins == 0) {
                distanceBonus -= runner.stats.trackAndDistancePerformance.starts; // Run this T/D but never win
            } else {
                trackDistanceBonus += Math.round(trackDistancePlacePercentage / 20);
            }
            pointBreakdownComment +=
                "-T/D perfomance points " + distanceBonus + " <br/>";

            // if (barrier < 5) {
            //     speedBarrierBonus = Math.round(runner.SpeedMap.Speed - runner.Barrier);
            //     pointBreakdownComment +=
            //         "-Speed/Barrier points " + speedBarrierBonus + " <br/>";
            // }
            if(barrier > 15) {
              barrierBonus -= 10;
              pointBreakdownComment +=
                    "-Barrier too far points " + barrierBonus + " <br/>";
            } else if(barrier > 12) {
              barrierBonus -= 5;
              pointBreakdownComment +=
                    "-Barrier too far points " + barrierBonus + " <br/>";
            }

            if (race.Distance <= 1000) {
                speedDistanceBonus = Number(runner.SpeedMap.Speed);
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
                "speedBarrierBonus: " +
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
            var bonus = 0;
            if (WITH_JOCK) {
                var jockeyBonus = getJockeyPoints(runner.Jockey.Name, state);
                pointBreakdownComment += "-Jockey points + " + jockeyBonus + " <br/>";
                bonus =
                    speedBarrierBonus +
                    speedDistanceBonus +
                    distanceBonus +
                    trackBonus +
                    trackDistanceBonus +
                    conditionBonus +
                    formBonus +
                    ageBonus +
                    barrierBonus;
                bonus += jockeyBonus;
            } else {
                bonus =
                    speedBarrierBonus +
                    speedDistanceBonus +
                    distanceBonus +
                    trackBonus +
                    trackDistanceBonus +
                    conditionBonus +
                    formBonus +
                    ageBonus+
                    barrierBonus;
            }
            // var totalPoints = bonus + penalty;
            steveCoPointsCell.innerHTML = bonus;
            pointBreakdownComentArray.push(pointBreakdownComment);
        }
    });

    averagePrizeArray.sort((a, b) => a - b);
    var finalPoints = 0;
    var totalPointsFromPrizePool = totalPrizePool / 250;
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
      if (form.Finish >= 4 && form.Finish <= 7) {
          specialFinish++;
      } else {
          specialFinish = 0;
      }
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

                if (form.Finish == 2) {
                    if (form.Margin >= 15) { // this runner probably gave up, dont count

                    } else if (form.Margin >= 4) {
                        pointBreakdownComment += "-Finished at " + form.Finish + ", but " + form.Margin + "L far away, points -10<br/>";
                        formBonus -= 10; // finished too far away
                    } else if (form.Margin >= 2) {
                        pointBreakdownComment += "-Finished at " + form.Finish + ", but " + form.Margin + "L far away, points -5<br/>";
                        formBonus -= 5; // finished too far away
                    }
                }

                if (form.Finish == 3) {
                    if (form.Margin >= 15) { // this runner probably gave up, dont count

                    } else if (form.Margin >= 6) {
                        pointBreakdownComment += "-Finished at " + form.Finish + ", but " + form.Margin + "L far away, points -10<br/>";
                        formBonus -= 10; // finished too far away
                    } else if (form.Margin >= 3) {
                        pointBreakdownComment += "-Finished at " + form.Finish + ", but " + form.Margin + "L far away, points -5<br/>";
                        formBonus -= 5; // finished too far away
                    }
                }

                if (form.Finish != 1 && form.Margin <= 0.3) {
                    pointBreakdownComment += "-Finished at " + form.Finish + ", only " + form.Margin + "L far away, points +10<br/>";
                    formBonus += 10;
                } else if (form.Finish != 1 && form.Margin <= 1){
                    pointBreakdownComment += "-Finished at " + form.Finish + ", only " + form.Margin + "L far away, points +5<br/>";
                    formBonus += 5;
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
                pointBreakdownComment += "-Finished 1st points +10<br/>";
                formBonus += 10;
            } else if (form.Finish == 2) {
                pointBreakdownComment += "-Finished 2nd points +6<br/>";
                formBonus += 3;
            } else if (form.Finish == 3) {
                pointBreakdownComment += "-Finished 3rd points +3<br/>";
                formBonus += 1;
            } else {
                pointBreakdownComment += "-Out of placings points -" + form.Finish +"<br/>";
                formBonus -= form.Finish;
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
                    switch (form.Finish) {
                        case 1:
                            conditionBonus = 5;
                            break;
                        case 2:
                            conditionBonus = 3;
                            break;
                        case 3:
                            conditionBonus = 1;
                            break;

                    }

                    pointBreakdownComment +=
                        "-Condition points " + conditionBonus + " <br/>";
                }

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
    console.log(
        "Jock = " + jockey.toLowerCase() + " | State = " + state.toLowerCase()
    );
    var points = 0;
    switch (state.toLowerCase()) {
        case "nsw".toLowerCase():
            switch (jockey.toLowerCase()) {
                case "James McDonald".toLowerCase():
                    points = 20;
                    break;
                case "William Pike".toLowerCase():
                    points = 20;
                    break;
                case "Ashley Morgan".toLowerCase():
                    points = 19;
                    break;
                case "Hugh Bowman".toLowerCase():
                    points = 18;
                    break;
                case "Tommy Berry".toLowerCase():
                    points = 17;
                    break;
                case "Jason Collett".toLowerCase():
                    points = 16;
                    break;
                case "Dylan Gibbons".toLowerCase():
                    points = 15;
                    break;
                case "Mathew Cahill".toLowerCase():
                    points = 14;
                    break;
                case "Grant Buckley".toLowerCase():
                    points = 13;
                    break;
                case "Reece Jones".toLowerCase():
                    points = 12;
                    break;
                case "Grant Buckley".toLowerCase():
                    points = 11;
                    break;
                case "Tim Clark".toLowerCase():
                    points = 10;
                    break;
                case "Winona Costin".toLowerCase():
                    points = 9;
                    break;
                case "Brodie Loy".toLowerCase():
                    points = 8;
                    break;
                case "Ben Looker".toLowerCase():
                    points = 7;
                    break;
                case "Jackson Searle".toLowerCase():
                    points = 6;
                    break;
                case "Jeff Penza".toLowerCase():
                    points = 5;
                    break;
                case "Brooke Stower".toLowerCase():
                    points = 4;
                    break;
                case "Aaron Bullock".toLowerCase():
                    points = 3;
                    break;
                case "Christian Reith".toLowerCase():
                    points = 2;
                    break;
                case "Mikayla Weir".toLowerCase():
                    points = 1;
                    break;
                default:
                    points = 0;
                    break;
            }
            break;

        case "Vic".toLowerCase():
            switch (jockey.toLowerCase()) {
                case "Damian Lane".toLowerCase():
                    points = 20;
                    break;
                case "J Allen".toLowerCase():
                    points = 19;
                    break;
                case "Jye McNeil".toLowerCase():
                    points = 18;
                    break;
                case "Damien Thornton".toLowerCase():
                    points = 17;
                    break;
                case "Jordan Childs".toLowerCase():
                    points = 16;
                    break;
                case "Jason Collett".toLowerCase():
                    points = 15;
                    break;
                case "Jarrod Fry".toLowerCase():
                    points = 14;
                    break;
                case "Craig Newitt".toLowerCase():
                    points = 13;
                    break;
                case "Patrick Moloney".toLowerCase():
                    points = 12;
                    break;
                case "Will Gordon".toLowerCase():
                    points = 11;
                    break;
                case "Zac Spain".toLowerCase():
                    points = 10;
                    break;
                case "Jamie Kah".toLowerCase():
                    points = 9;
                    break;
                case "Damien Oliver".toLowerCase():
                    points = 8;
                    break;
                case "Michael Dee".toLowerCase():
                    points = 7;
                    break;
                case "Beau Mertens".toLowerCase():
                    points = 6;
                    break;
                case "Blaike McDougall".toLowerCase():
                    points = 6;
                    break;
                case "Brett Prebble".toLowerCase():
                    points = 5;
                    break;
                case "Declan Bates".toLowerCase():
                    points = 5;
                    break;
                case "Josh Richards".toLowerCase():
                    points = 4;
                    break;
                case "Jack Hill".toLowerCase():
                    points = 3;
                    break;
                case "Craig Williams".toLowerCase():
                    points = 2;
                    break;
                case "Dean Holland".toLowerCase():
                    points = 1;
                    break;
                default:
                    points = 0;
                    break;
            }
            break;

        case "WA".toLowerCase():
            switch (jockey.toLowerCase()) {
                case "Clint Johnston-Porter".toLowerCase():
                    points = 20;
                    break;
                case "Chris Parnham".toLowerCase():
                    points = 19;
                    break;
                case "Natasha Faithfull".toLowerCase():
                    points = 18;
                    break;
                case "Holly Watson".toLowerCase():
                    points = 17;
                    break;
                case "Brad Rawiller".toLowerCase():
                    points = 16;
                    break;
                case "Shaun O'Donnell".toLowerCase():
                    points = 15;
                    break;
                case "Troy Turner".toLowerCase():
                    points = 14;
                    break;
                case "Joseph Azzopardi".toLowerCase():
                    points = 13;
                    break;
                case "Jason Whiting".toLowerCase():
                    points = 12;
                    break;
                case "Shaun McGruddy".toLowerCase():
                    points = 11;
                    break;
                case "Lucy Warwick".toLowerCase():
                    points = 10;
                    break;
                case "Laqdar Ramoly".toLowerCase():
                    points = 9;
                    break;
                case "Patrick Carbery".toLowerCase():
                    points = 8;
                    break;
                case "Keshaw Dhurun".toLowerCase():
                    points = 7;
                    break;
                case "Brad Parnham".toLowerCase():
                    points = 6;
                    break;
                case "Kyra Yuill".toLowerCase():
                    points = 5;
                    break;
                case "Lisa Staples".toLowerCase():
                    points = 4;
                    break;
                case "Andrew Castle".toLowerCase():
                    points = 3;
                    break;
                case "Jade McNaught".toLowerCase():
                    points = 2;
                    break;
                case "Jordan Turner".toLowerCase():
                    points = 1;
                    break;
                default:
                    points = 0;
                    break;
            }
            break;

        case "SA".toLowerCase():
            switch (jockey.toLowerCase()) {
                case "Kayla Crowther".toLowerCase():
                    points = 20;
                    break;
                case "Barend Vorster".toLowerCase():
                    points = 19;
                    break;
                case "Ben Price".toLowerCase():
                    points = 18;
                    break;
                case "Jake Toeroek".toLowerCase():
                    points = 17;
                    break;
                case "Jason Holder".toLowerCase():
                    points = 16;
                    break;
                case "Angus Chung".toLowerCase():
                    points = 15;
                    break;
                case "Ryan Hurdle".toLowerCase():
                    points = 14;
                    break;
                case "Todd Pannell".toLowerCase():
                    points = 13;
                    break;
                case "Paul Gatt".toLowerCase():
                    points = 12;
                    break;
                case "Dom Tourneur".toLowerCase():
                    points = 11;
                    break;
                case "Justin Potter".toLowerCase():
                    points = 10;
                    break;
                case "Jacob Opperman".toLowerCase():
                    points = 9;
                    break;
                case "Ellis Wong".toLowerCase():
                    points = 8;
                    break;
                case "Karl Zechner".toLowerCase():
                    points = 7;
                    break;
                case "Teagan Voorham".toLowerCase():
                    points = 6;
                    break;
                case "Jessica Eaton".toLowerCase():
                    points = 5;
                    break;
                case "Anna Jordsjo".toLowerCase():
                    points = 4;
                    break;
                case "Sophie Logan".toLowerCase():
                    points = 3;
                    break;
                case "Jeffrey Maund".toLowerCase():
                    points = 2;
                    break;
                case "Stacey Callow".toLowerCase():
                    points = 1;
                    break;
                default:
                    points = 0;
                    break;
            }
            break;
        case "QLD".toLowerCase():
            switch (jockey.toLowerCase()) {
                case "James Orman".toLowerCase():
                    points = 20;
                    break;
                case "Ryan Maloney".toLowerCase():
                    points = 19;
                    break;
                case "Jasmine Cornish".toLowerCase():
                    points = 18;
                    break;
                case "Kyle Wilson-Taylor".toLowerCase():
                    points = 17;
                    break;
                case "Ryan Wiggins".toLowerCase():
                    points = 16;
                    break;
                case "Tahlia Fenlon".toLowerCase():
                    points = 15;
                    break;
                case "Justin Stanley".toLowerCase():
                    points = 14;
                    break;
                case "Lacey Morrison".toLowerCase():
                    points = 13;
                    break;
                case "Angela Jones".toLowerCase():
                    points = 12;
                    break;
                case "Noel Callow".toLowerCase():
                    points = 11;
                    break;
                case "Jim Byrne".toLowerCase():
                    points = 10;
                    break;
                case "Zac Lloyd".toLowerCase():
                    points = 9;
                    break;
                case "Boris Thornton".toLowerCase():
                    points = 8;
                    break;
                case "Jaden Lloyd".toLowerCase():
                    points = 7;
                    break;
                case "Ben Thompson".toLowerCase():
                    points = 6;
                    break;
                case "Tiffani Brooker".toLowerCase():
                    points = 5;
                    break;
                case "Samantha Collett".toLowerCase():
                    points = 4;
                    break;
                case "Nathan Day".toLowerCase():
                    points = 3;
                    break;
                case "Marnu Potgieter".toLowerCase():
                    points = 2;
                    break;
                case "Les Tilley".toLowerCase():
                    points = 1;
                    break;
                default:
                    points = 0;
                    break;
            }
            break;
        default:
            points = 0;
            break;
    }
    console.log("JOCK POINTS = " + points);
    return points * 3 / 10;
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