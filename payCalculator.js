function timeExtractor(array){
  return array.map(item => {

      if(item === ""){
          return {original: "line"};
      }else{
          const [firstHalf, secondHalf] = item.split("to").map(time => time.trim());
          const startTime = firstHalf.split(" ").slice(-2).join(" ");
          const endTime = secondHalf.split(" ").slice(0,2).join(" ");
          let jobType = "";
          if (secondHalf.split(" ").length === 3){
              jobType = "barrier";
          }
          const pay = payCalculator(startTime, endTime, jobType);
          return {original: item, pay};
      }
  });
}

function payCalculator(startTime, endTime, jobType){
  console.log(jobType);
  const [hourDiff, minDiff] = timeDiffCalculator(startTime, endTime);
  let totalPay;
  if (jobType.toLowerCase() === "barrier"){
      totalPay = hourDiff * 40 + minDiff * 0.667;    
  }else{
      totalPay = hourDiff * 30 + minDiff * 0.5;
  }
  totalPay = totalPay.toFixed(2);
  return totalPay;
}

function timeDiffCalculator(startTime, endTime){    //function to calculate timeDifference between working periods
  const [startHour, startMin] = timeConverter(startTime);
  const [endHour, endMin] = timeConverter(endTime);
  let hourDiff = endHour - startHour;
  let minDiff = endMin - startMin;
  
  if (minDiff < 0){
      minDiff = minDiff + 60;
      hourDiff -= 1;
  }

  return [hourDiff, minDiff];
}


//creating a function to convert the time to 24 hour format

function timeConverter(timeStr){
  const [time, type] = timeStr.split(" ");
  var [hours, mins] = time.split(":").map(Number);

  if (type === "pm" && hours != 12){
      hours += 12;
  }

  if(type === "am" && hours === 12){
      hours = 0;
  }
  return [hours, mins];
}

module.exports = {timeExtractor, payCalculator, timeDiffCalculator, timeConverter};