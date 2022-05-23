const url = "https://01.kood.tech/api/graphql-engine/v1/graphql";
let userImage = document.getElementById("profilePicture");
let username = document.getElementById("username");
let userid = document.getElementById("userid");
let auditsdone = document.getElementById("auditsdone");
let auditsreceived = document.getElementById("auditsreceived");
let searchfield = document.getElementById("searchfield");
let searchbutton = document.getElementById("searchbutton");
let totalxp = document.getElementById("totalxp");
let auditratio = document.getElementById("auditratio");
let level = document.getElementById("level");
let expchart = document.getElementById("expchart");
let attemptschart = document.getElementById("attemptschart");
let projectsContainer = document.getElementById("projectsContainer");
let projects = document.getElementById("projects");
let profilePicture = document.getElementById("profilePicture");
let doneProjectsClick = document.getElementById("doneProjectsClick");
let offset;
let xparray = [];
let uparray = [];
let downarray = [];
let patharray = [];
let dateofexparray = [];
let projectsdonearray = [];

let objectIds = [];
let flag = true;

function addListeners() {
  searchfield.addEventListener("keypress", (e) => {
    if (e.key == "Enter") {
      searchUser();
    }
  });
  searchfield.addEventListener("keyup", searchUser);

  // searchbutton.addEventListener("click", searchUser);

  doneProjectsClick.addEventListener("click", addDivs);
}
addListeners();
searchUser();

async function searchUser() {
  xparray = [];
  dateofexparray = [];
  uparray = [];
  downarray = [];
  patharray = [];
  projectsdonearray = [];
  dateofexparray = [];
  objectIds = [];
  userImage.src = "/404.jpg";
  userid.innerHTML = "";
  auditsdone.innerHTML = "";
  auditsreceived.innerHTML = "";
  totalxp.innerHTML = "";
  auditratio.innerHTML = "";
  expchart.innerHTML = "";
  attemptschart.innerHTML = "";
  doneProjectsClick.style.opacity = "0";
  projects.innerHTML = "";
  projects.style.opacity = "0";

  await getUsernameAndId();
  //console.log(username.innerHTML);

  if (flag) {
    await getTransactions();
    await getProgresses();
    await buildCharts();
    doneProjectsClick.style.opacity = "100";
    projects.style.opacity = "100";

    await test();
    await test2();
    flag = true;
  }
}

async function getUsernameAndId() {
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `{
                    user(where:{login:{_eq: ${searchfield.value} }})
                    {
                        id
                        login
                    }
                }`,
    }),
  })
    .then((res) => res.json())
    .then((r) => {
      username.innerHTML = r.data["user"][0]["login"];
      getProfilePicture(username.innerHTML);
      userid.innerHTML = "User ID: " + r.data["user"][0]["id"];
      flag = true;
      return r;
    })
    .catch(() => {
      username.innerHTML = "No such user";
      flag = false;
    });
}

async function getProgresses() {
  let loop = true;
  offset = 0;

  while (loop) {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{
                    user(where: {login:{_eq: ${searchfield.value} }})
                    {
                        progresses(offset: ${offset})
                        {                        
                            path
                            createdAt
                        }
                    }
                }`,
      }),
    })
      .then((r) => r.json())
      .then((r) => {
        //console.log(r);

        r.data["user"][0]["progresses"].forEach((element) => {
          patharray.push(element.path);
        });

        //console.log( r.data["user"][0]["transactions"].length)
        offset += 50;
        //console.log('offset = ', offset)
        if (r.data["user"][0]["progresses"].length !== 50) {
          loop = false;
        }
      });
  }
  //console.log("patharray=", patharray);
}

async function getTransactions() {
  let loop = true;
  offset = 0;

  while (loop) {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{
                    user(where: {login:{_eq: ${searchfield.value} }})
                    {
                        transactions(offset: ${offset})
                        {       
                            amount                     
                            path
                            type
                            createdAt
                        }
                    }
                }`,
      }),
    })
      .then((r) => r.json())
      .then((r) => {
        //console.log(r)
        try {
          r.data["user"][0]["transactions"].forEach((element) => {
            if (element.type == "xp") {
              xparray.push(element.amount);
              dateofexparray.push(element.createdAt);
              //projectsdonearray.push(element);
            } else if (element.type == "up") {
              uparray.push(element.amount);
            } else if (element.type == "down") {
              downarray.push(element.amount);
            }
          });
        } catch (error) {
          console.log(error);
        }

        //console.log( r.data["user"][0]["transactions"].length)
        offset += 50;
        //console.log('offset = ', offset)
        if (r.data["user"][0]["transactions"].length !== 50) {
          loop = false;
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
  //console.log('xparray = ', xparray)
  //console.log("dateofexparray=", dateofexparray);
  // console.log('uparray = ', uparray)
  // console.log('downarray = ', downarray)

  let totalexp = formatExp(
    xparray.reduce((value1, value2) => value1 + value2)
  ).split(" ");
  totalxp.innerHTML =
    "Total EXP: " + Math.round(totalexp[0] * 100) / 100 + totalexp[1];
  auditsdone.innerHTML = "Audits done: " + uparray.length;
  auditsreceived.innerHTML = "Audits received: " + downarray.length;
  let upexp = uparray.reduce((value1, value2) => value1 + value2, 0);
  //console.log("upexp = ",upexp)
  let downexp = downarray.reduce((value1, value2) => value1 + value2, 0);
  auditratio.innerHTML =
    "Audit ratio: " + Math.round((((upexp / downexp) * 10) / 10) * 100) / 100;
}

async function buildCharts() {
  //console.log(xparray);
  let XPGainArray = Array.from(xparray);
  //console.log("xpgainarray = ", XPGainArray);
  XPGainArray.reduce((v1, v2, i) => (XPGainArray[i] = v1 + v2));

  let occurrences = {};
  //   console.log("occure",occurrences);
  //   console.log("patharray=",patharray);

  for (const element of patharray) {
    if (occurrences[element]) {
      occurrences[element] += 1;
    } else {
      occurrences[element] = 1;
    }
  }

  //console.log("occurrences", occurrences);
  let occurrenceCount = Object.values(occurrences);
  //console.log("occurrenceCount=",occurrenceCount);
  let projects = Object.keys(occurrences);
  //   console.log("projects=",projects);

  google.charts.load("current", { packages: ["corechart", "bar"] });
  google.charts.setOnLoadCallback(drawCharts);

  function drawCharts() {
    var data1 = new google.visualization.DataTable();
    var data2 = new google.visualization.DataTable();

    data1.addColumn("datetime", "Time");
    data1.addColumn("number", "XP");

    data2.addColumn("string", "Projects");
    data2.addColumn("number", "Attempts");

    for (var i = 0; i < dateofexparray.length; i++) {
      var row = [new Date(dateofexparray[i]), XPGainArray[i]];
      data1.addRow(row);
    }

    for (var i = 0; i < projects.length; i++) {
      var row = [projects[i], occurrenceCount[i]];
      data2.addRow(row);
    }

    var chart1 = new google.visualization.LineChart(expchart);
    var chart2 = new google.visualization.ColumnChart(attemptschart);
    chart1.draw(data1, {
      hAxis: { title: "Time", format: "MMM YYYY" },
      vAxis: { title: "XP" },
      colors: ["yellow"],
    });
    chart2.draw(data2, {
      hAxis: { title: "Projects", textPosition: "none" },
      vAxis: { title: "Attempts" },
      colors: ["blue"],
    });
  }
}

function getProfilePicture(username) {
  userImage.src = `https://git.01.kood.tech/user/avatar/${username}/-1`;
}

async function test() {
  let loop = true;
  offset = 0;

  while (loop) {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
        {
          user(where: {login:{_eq: ${searchfield.value} }}) {
            login
            progresses(where: { isDone: { _eq: true }}, offset:${offset}) {
              path
              isDone
              objectId
            }
          }
        }
        `,
      }),
    })
      .then((r) => r.json())
      .then((r) => {
        //console.log(r);

        r.data["user"][0]["progresses"].forEach((element) => {
          if (!objectIds.includes(element.objectId)) {
            objectIds.push(element.objectId);
          }
        });

        offset += 50;
        if (r.data["user"][0]["progresses"].length !== 50) {
          loop = false;
        }
      });
  }
  //console.log("objectIds = ", objectIds);
  //await test2();
  //drawProjectList()
  //projectsdonearray = await test2()

  //addDivs()
}
function addDivs() {
  // console.log(projectsdonearray);
  projects.innerHTML = "";
  //projectsdonearray = await test2();
  projectsdonearray.reverse();
  projectsdonearray.forEach((element) => {
    //console.log("I");

    let div = document.createElement("tr");
    div.id = "projectElement";
    let name = document.createElement("td");
    let txt = element.path.split("/");
    name.innerHTML = txt[txt.length - 1];

    let exp = document.createElement("td");
    exp.innerHTML = formatExp(element.amount);

    let date = document.createElement("td");
    let d = new Date(element.createdAt);
    const formattedDate = d
      .toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-");
    date.innerHTML = formattedDate;
    div.appendChild(name);
    div.appendChild(exp);
    div.appendChild(date);
    projects.appendChild(div);
  });
}
async function test2() {
  objectIds.forEach(async function f(element) {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
        {
          user(where: { login: { _eq: ${searchfield.value} } }) {
            login
            transactions(where: {objectId:{_eq: ${element} }type:{_eq:"xp"}},
              order_by:{amount:desc},
            limit:1)
            {
              objectId
              path
              type
              amount
              createdAt
              
            }
          }
        }
        `,
      }),
    })
      .then((r) => r.json())
      .then((r) => {
        //console.log(r);
        if (r.data["user"][0]["transactions"].length === 1) {
          projectsdonearray.push(r.data["user"][0]["transactions"][0]);
        }
      });
  });
}

function formatExp(exp) {
  if (exp > 1000000) {
    return exp / 1000000 + " Mb";
  } else if (exp > 1000) {
    return exp / 1000 + " Kb";
  } else return exp + " B";
}
