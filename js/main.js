// Denna fil ska innehålla din lösning till uppgiften (moment 5).

"use strict";

/* Här under börjar du skriva din JavaScript-kod */

/* ----------------------------- Main variables ----------------------------- */
const body = document.querySelector('body');
const mainContainer = document.querySelector('.container');
const mainHeader = document.querySelector('#mainheader');
const mainHeaderContainer = document.querySelector('.contain');
const toggleContainer = document.createElement('div');
const leftColumnContainer = document.querySelector('.clist');
const channelNavList = document.querySelector("#mainnavlist");
const listLengthInput = document.querySelector("#numrows");
const footer = document.querySelector('footer');
let channelList = [];
if(localStorage.getItem("listLength") === null){
  localStorage.setItem("listLength", listLengthInput.value)
}
else {
  listLengthInput.value = localStorage.getItem("listLength");
}
let firstRun = true;

/* ----------- Dark mode toggle variables, style and local storage ---------- */
toggleContainer.id = "toggleContainer";
toggleContainer.style.display = "inline-block";
toggleContainer.style.marginLeft = "1rem"
const lightButton = document.createElement('input');
lightButton.type = "radio";
lightButton.id = "light";
lightButton.name = "darkModeToggle";
const lightButtonLabel = document.createElement('label');
lightButtonLabel.setAttribute("for", "light")
lightButtonLabel.innerText = "Ljust"
lightButtonLabel.style.marginRight = "1rem";
const darkButton = document.createElement('input');
darkButton.type = "radio";
darkButton.id = "dark";
darkButton.name = "darkModeToggle";
const darkButtonLabel = document.createElement('label');
darkButtonLabel.setAttribute("for", "dark")
darkButtonLabel.innerText = "Mörkt";
toggleContainer.append(lightButton, lightButtonLabel, darkButton, darkButtonLabel);
mainHeaderContainer.appendChild(toggleContainer);
let darkModeValue = localStorage.getItem("darkMode") || "light";
localStorage.setItem("darkMode", darkModeValue);
if (localStorage.getItem("darkMode") === "light" && lightButton.checked === false && darkButton.checked === false){
  lightButton.checked = true;
}
else{
  darkButton.checked = true;
}

/* -------------------- Radio player variables and style -------------------- */
const radioPlayContainer = document.querySelector('#player');
radioPlayContainer.style.display = "flex";
radioPlayContainer.style.height = "50px";
radioPlayContainer.style.alignItems = "center";
const radioPlayButton = document.querySelector('#playbutton');
const radioPlayChannelList = document.querySelector('#playchannel');
radioPlayChannelList.style.margin = "0 1em";
const audioPlayer = document.createElement('audio');
audioPlayer.style.width = "190px"
audioPlayer.style.height = "30px";
audioPlayer.controls = true;
audioPlayer.style.display = "none";
const audioPlayerSource = document.createElement('source');
audioPlayerSource.type = "audio/mp3";
audioPlayer.appendChild(audioPlayerSource);
radioPlayContainer.insertBefore(audioPlayer, radioPlayChannelList);

/* ------------------------ Box to display a channel ------------------------ */
const channelBoxTemplate = document.createElement('div');
mainContainer.appendChild(channelBoxTemplate);
channelBoxTemplate.id = "channelBox";


/* ------------------- Box to display last played channel ------------------- */
let lastPlayedBox = channelBoxTemplate.cloneNode(true);
lastPlayedBox.id = "lastPlayedContainer";
const clearHistoryButton = document.createElement('button');

/* --------------------- Container for favorite channels -------------------- */
const h2Radio = document.querySelector('.container h2');
const favoritesMainContainer = document.createElement('div');
favoritesMainContainer.id = "favoritesMainContainer";
favoritesMainContainer.style.display = "none";
const favoriteChannelsContainer = document.createElement('div');
favoriteChannelsContainer.id = "favoriteChannelsContainer";
favoriteChannelsContainer.style.display = "flex";
favoriteChannelsContainer.style.flexWrap = "wrap";
favoriteChannelsContainer.style.gap = "1rem"
favoriteChannelsContainer.style.margin = "auto";
const favoriteTitle = document.createElement('h4');
favoriteTitle.textContent = "Favoriter: ";
favoritesMainContainer.append(favoriteTitle, favoriteChannelsContainer);
const topContainer = document.createElement('div');
topContainer.id ="topContainer";
topContainer.style.marginBottom = "1rem";
topContainer.append(h2Radio, favoritesMainContainer);
mainContainer.insertBefore(topContainer, mainContainer.children[0]);


/* ---------------- Placeholder title for schedule container ---------------- */
const scheduleContainer = document.querySelector("#info");
const scheduleTitle = document.createElement("h5");
scheduleTitle.innerText = "Tryck på en av kanalerna för att få upp tablån";
scheduleContainer.appendChild(scheduleTitle);

fetch('https://api.sr.se/api/v2/channels?format=json')
.then(response => response.json())
.then(channelPages => {
  /* ------------------- Loops through all pages of channels ------------------ */
  let totalPagesofChannels = channelPages.pagination.totalpages;
  let allPromises = [];
  for (let i = 1; i <= totalPagesofChannels; i++) {
    let promise = fetch(`https://api.sr.se/v2/channels?format=json&page=${i}`)
      .then(response => response.json())
      .then(channelsObject => {
        channelsObject.channels.forEach(channel => {  
          channelList.push(channel);      
        })
        /* --------------- Sorts channels from smallest to biggest id --------------- */
        channelList.sort((a, b) => {
          return a.id - b.id;
        })      
      })
      .catch(error =>{
        console.error("Något gick fel: ", error);     
      })
      /* -------------------- Collects all fecthes in an array -------------------- */
      allPromises.push(promise)
  }
  /* ---------------- Continues after all fetches are completed --------------- */
  return Promise.all(allPromises);
})

/* --------------------- Main functionality of the page --------------------- */
.then(() => {
  channelList.forEach(channel => {
    createChannelListItem(channel);
    createRadioPlayChannelListOption(channel);
  })
  /* -------------------------- Navlist functionality ------------------------- */
  displayNavList();
  loadChannelFavorites();
  lastPlayed();
  listLengthInput.addEventListener('change', function() {
    displayNavList();
  }, false);

  /* -------------- Plays channel and displays schedule on click -------------- */
  radioPlayButton.addEventListener('click', function() {
    let activeChannel = getActiveChannel();  
    displaySchedule(activeChannel);
    playRadioChannel(activeChannel);
    /* --------- Saves active channel as the last played in json format --------- */
    localStorage.setItem("lastPlayedChannel", JSON.stringify(activeChannel))
    lastPlayed();
  }, false);

  darkModeToggle();
  toggleContainer.addEventListener('click', darkModeToggle, false);
  window.addEventListener('resize', darkModeToggle, false);
})

.catch(error =>{
  console.error("Något gick fel: ", error);     
})


/* -------------------------------------------------------------------------- */
/*                                  Functions                                 */
/* -------------------------------------------------------------------------- */


/* -------------- Function to create a schedule from channel id ------------- */
function createChannelScheduleFromId(channelId){
  let allPromises = [];
  let programList = [];
  fetch(`https://api.sr.se/v2/scheduledepisodes?channelid=${channelId}&format=json`)
    .then(response => response.json())
    .then(channelScheduleObject => {
      /* ------------------- Loops through all pages of programs ------------------ */
      let totalPagesofPrograms = channelScheduleObject.pagination.totalpages;
      for (let i = 1; i <= totalPagesofPrograms; i++) {
        let promise = fetch(`https://api.sr.se/v2/scheduledepisodes?channelid=${channelId}&format=json&page=${i}`)
          .then(response => response.json())
          .then(scheduleObject => {
            scheduleObject.schedule.forEach(program => {
              programList.push(program);
            })
            /* ---------------- Sorts programs in the array by start time ---------------- */
            programList.sort((a, b) => {
              a.startTime = Number(a.starttimeutc.replace(/\D/g, ""));
              b.startTime = Number(b.starttimeutc.replace(/\D/g, ""));         
              return a.startTime - b.startTime;
            })   
          })
          .catch(error => {
            console.error("Något gick fel: ", error); 
          })
          /* -------------------- Collects all fecthes in an array -------------------- */
          allPromises.push(promise);
      }
      /* ---------------- Continues after all fetches are completed --------------- */
      return Promise.all(allPromises);
      })
      .then(() => { 
        programList.forEach(program => {
              /* --------------------- Creates schedule-items content --------------------- */
              const radioProgram = document.createElement("div");
              const programTitle = document.createElement("h3");
              const programSubtitle = document.createElement("h4");
              const programRuntime = document.createElement("p");
              const programInfo = document.createElement("p");
              
              /* --------------------- Checks the runtime of the program --------------------- */         
              let startTimeString = program.starttimeutc.replace(/\D/g, "");
              let startTime = new Date(Number(startTimeString));
              let startTimeHour = startTime.getHours();
              if (startTimeHour < 10){
                startTimeHour = "0" + startTimeHour;
              }
              let startTimeMinute = startTime.getMinutes();
              if (startTimeMinute < 10){
                startTimeMinute = "0" + startTimeMinute;
              }
              let endTimeString = program.endtimeutc.replace(/\D/g, "");
              let endTime = new Date(Number(endTimeString));
              let endTimeHour = endTime.getHours();
              if (endTimeHour < 10){
                endTimeHour = "0" + endTimeHour;
              }
              let endTimeMinute = endTime.getMinutes();
              if (endTimeMinute < 10){
                endTimeMinute = "0" + endTimeMinute;
              }
              let runtime = `${startTimeHour}:${startTimeMinute} - ${endTimeHour}:${endTimeMinute}`;
              programRuntime.textContent = runtime; 

              /* ----------------- Only writes upcoming or current program ---------------- */
              let currentTime = new Date();    
              if (endTime > currentTime){
              // Child 1
              programTitle.textContent =  program.title;
              radioProgram.appendChild(programTitle);
              // Child 2
              if (program.subtitle){
                programSubtitle.textContent = program.subtitle;
                radioProgram.appendChild(programSubtitle);
              }
              // Child 3
              radioProgram.appendChild(programRuntime);
              // Child 4
              programInfo.textContent = program.description;
              radioProgram.appendChild(programInfo);
              // Child 5
              const separator = document.createElement("div");
              separator.style.backgroundColor ="lightgrey";
              separator.style.width = "100%";
              separator.style.height = "1px";
              radioProgram.appendChild(separator);
              // Parent & parent-container
              scheduleContainer.appendChild(radioProgram);
              }
      })         
    })
}

function createScheduleTitleAndFavoriteButton(channel){
  scheduleContainer.innerHTML="";
  const scheduleTopContainer = document.createElement("div");
  scheduleTopContainer.className = "scheduleTopContainer"; 
  scheduleTopContainer.style.display = "flex";
  scheduleTopContainer.style.justifyContent = "space-between";
  scheduleTopContainer.style.alignItems = "center";

  const channelName = document.createElement("h1");
  channelName.textContent = channel.name;
  channelName.style.textDecoration = "underline";
  channelName.style.color = "#D04900";
  channelName.style.margin = "0";

  let manageFavoritesContainer = document.createElement('div');
  let containerTitle = document.createElement('h4');
  containerTitle.textContent = "Favorit: "
  let buttonsContainer = document.createElement('div');
  buttonsContainer.style.display = "flex";
  buttonsContainer.style.gap = "1rem"

  const addFavoriteButtonTemplate = document.querySelector('#playbutton');
  let addFavoriteButton = addFavoriteButtonTemplate.cloneNode(true);
  addFavoriteButton.textContent = "Lägg till";
  addFavoriteButton.addEventListener('click', function(){
    addChannelToFavorites(channel);
  }, false);
  
  let removeFavoriteButton = addFavoriteButtonTemplate.cloneNode(true);
  removeFavoriteButton.addEventListener('click', function(){
    removeChannelFromFavorites(channel);
  }, false);
  removeFavoriteButton.textContent = "Ta bort";

  let clearButton = addFavoriteButtonTemplate.cloneNode(true); 
  clearButton.innerText = "Rensa favoriter"
  clearButton.addEventListener('click', function(){
    favoriteChannelsContainer.innerHTML = "";
    favoritesMainContainer.style.display = "none";
    let empty = [];
    localStorage.setItem("favoriteChannelsList", JSON.stringify(empty));
  }, false);

  buttonsContainer.append(addFavoriteButton, removeFavoriteButton, clearButton);
  manageFavoritesContainer.append(containerTitle, buttonsContainer)
  scheduleTopContainer.append(channelName, manageFavoritesContainer);
  scheduleContainer.appendChild(scheduleTopContainer);
}

/* ---------------------- Function to display schedule ---------------------- */
function displaySchedule(channel) {
  createScheduleTitleAndFavoriteButton(channel);
  createChannelScheduleFromId(channel.id);
  darkModeToggle();
}


/* ----------------- Creates navlist item and event handler ----------------- */
function createChannelListItem(channel){
  const channelListItem = document.createElement("li");
  const listItemContent = document.createElement("a");
  listItemContent.style.display = "block"; 

  /* ---------------------- Display description on hover ---------------------- */
  channelListItem.title = channel.tagline;
  /* --------------- Display channel title and schedule on click -------------- */
 
  channelListItem.addEventListener('click', function(){
    displaySchedule(channel);
  }, false);
  listItemContent.textContent = channel.name;
  channelListItem.appendChild(listItemContent);
  channelListItem.style.display = "none";
  channelNavList.appendChild(channelListItem);
}


/* --------- Function to display amount of navlist items from input --------- */
function displayNavList(){
  const listItems = document.querySelectorAll("#mainnavlist li"); 
  /* -------------------- Saves list length to local storage ------------------- */
  localStorage.setItem("listLength", listLengthInput.value);
  let listLength = localStorage.getItem("listLength");

  if(listLength > listItems.length){
    listLengthInput.value = listItems.length;
  }
  else if(listLength < 1){
    listLengthInput.value = 1;
  }
  for (let i = 0; i < listItems.length; i++) {
    listItems[i].style.display = "none"; 
  }
  for (let i = 0; i < listLength; i++){
    listItems[i].style.display = "block";
  }
}


/* ---------------------- Creates channel dropdown-menu --------------------- */
function createRadioPlayChannelListOption(channel){
  const radioPlayOption = document.createElement('option');
  radioPlayOption.id = channel.id;
  radioPlayOption.innerText = channel.name;
  radioPlayChannelList.appendChild(radioPlayOption);
}


/* ---------------------- Plays selected radio channel ---------------------- */
function playRadioChannel(channel){
  audioPlayer.style.display = "block"
  audioPlayerSource.src = channel.liveaudio.url;
  audioPlayer.load();
  audioPlayer.play();
}


/* ------------ Function to get active channel in dropdown select ----------- */
function getActiveChannel(){
  let activeChannelOption = radioPlayChannelList[radioPlayChannelList.selectedIndex];
  let activeChannel = {};
  channelList.forEach(channel => {
    if(Number(channel.id) === Number(activeChannelOption.id)){
      activeChannel = channel;   
    }
  })
  return activeChannel;
}


/* -------------- Function to create a box to display a channel ------------- */
function createChannelBox(channel){
  const playButtonTemplate = document.querySelector('#playbutton');
  const playButton = playButtonTemplate.cloneNode(true);
  playButton.addEventListener('click', function(){
    playRadioChannel(channel);
    displaySchedule(channel);
    localStorage.setItem("lastPlayedChannel", JSON.stringify(channel));
    lastPlayed();
  }, false)

  const channelName = document.createElement('h5');
  channelName.innerText = channel.name;
  channelName.style.color = "rgb(95, 95, 95)";
  const img = document.createElement('img');
  img.src = channel.image;
  img.alt = `${channel.name}'s channel image`;
  img.style.height = "50px";
  img.style.width = "auto";
  img.style.borderRadius = "50%";
  
  const nameAndButton = document.createElement('div');
  nameAndButton.append(channelName, playButton);

  const channelBoxTemplate = document.querySelector('#channelBox');
  const channelBox = channelBoxTemplate.cloneNode(true);
  channelBox.className = "channelBoxClass";
  channelBox.innerHTML = "";
  channelBox.style.display = "flex";
  channelBox.style.alignItems = "center";
  channelBox.style.gap = "1rem"
  channelBox.append(img, nameAndButton);

  channelBox.style.padding = "1rem"
  channelBox.style.backgroundColor = "#FAF9F6";
  channelBox.style.borderRadius = "1rem";
  channelBox.style.boxShadow = "-1px 1px 4px rgba(0, 0, 0, 0.5)";
  
  return channelBox;
}

/* -- Function to save last played channel to local storage and display it -- */
function lastPlayed(){
  let channel = JSON.parse(localStorage.getItem("lastPlayedChannel"));
  if(channel){   
    lastPlayedBox.innerHTML = "";
    clearHistoryButton.style.display = "block";
    lastPlayedBox.style.display = "block";
    const boxTitle = document.createElement('h4');
    boxTitle.innerText = "Senast spelade: ";
    let lastPlayedBoxContent = createChannelBox(channel);
    lastPlayedBox.append(boxTitle, lastPlayedBoxContent);
    leftColumnContainer.append(lastPlayedBox);  
    createClearHistoryButton(lastPlayedBox, leftColumnContainer);
  }
}


/* ---------------- Function to create a clear history button --------------- */
function createClearHistoryButton(buttonContainer, containerParent) {
  clearHistoryButton.className = "btn";
  clearHistoryButton.textContent = "Rensa historik";
  clearHistoryButton.style.marginTop = "1rem"
  clearHistoryButton.addEventListener('click', function() {
    localStorage.removeItem("lastPlayedChannel");
    buttonContainer.style.display = "none";
    clearHistoryButton.style.display = "none";
  }, false);
  containerParent.appendChild(clearHistoryButton);
  darkModeToggle();
}


/* ---------------- Function to add favorite channels on load --------------- */
function loadChannelFavorites(){
  let favoriteChannelsList = JSON.parse(localStorage.getItem("favoriteChannelsList")) || [];
  favoriteChannelsList.forEach(channel => {
    let channelBox = createChannelBox(channel);
    channelBox.id = "favorite-" + channel.id;
    favoriteChannelsContainer.appendChild(channelBox);
    favoritesMainContainer.style.display = "block";
  })
}


/* ------------------ Function to add channel to favorites ------------------ */
function addChannelToFavorites(channel){
  let favoriteChannelsList = JSON.parse(localStorage.getItem("favoriteChannelsList")) || [];
  let contains = favoriteChannelsList.some(storageChannel => storageChannel.id === channel.id);
  /* ---------------- Checks if a channel is already a favorite --------------- */
  if (contains){
    alert("Denna kanal är redan en favorit");
  }
  else{
    let channelBox = createChannelBox(channel);
    channelBox.id = "favorite-" + channel.id;
    favoriteChannelsContainer.appendChild(channelBox);
    favoritesMainContainer.style.display = "block";
    darkModeToggle();
    favoriteChannelsList.push(channel);
    localStorage.setItem("favoriteChannelsList", JSON.stringify(favoriteChannelsList));
  }
}


/* ---------------- Function to remove channel from favorites --------------- */
function removeChannelFromFavorites(channel){
  let favoriteChannelsList = JSON.parse(localStorage.getItem("favoriteChannelsList")) || [];
  const channelElementHTML = document.querySelector("#favorite-" + channel.id);
  let index = favoriteChannelsList.findIndex(storageChannel => storageChannel.id === channel.id);
  /* ------ Finds index of channel to be remove and splices it from array ----- */
  if (index !== -1){
    favoriteChannelsList.splice(index, 1);
    localStorage.setItem("favoriteChannelsList", JSON.stringify(favoriteChannelsList));
    channelElementHTML.remove();
    if (favoriteChannelsList.length === 0){
      favoritesMainContainer.style.display = "none";
    }
  }
  else{
    alert("Denna kanal är inte en favorit");
  }
}


/* -------------- Function to toggle dark mode for entire page -------------- */
function darkModeToggle(){
  /* --------------- Local sotrage management and querySelector --------------- */
  if (lightButton.checked){
    localStorage.setItem("darkMode", "light")
  }
  else{
    localStorage.setItem("darkMode", "dark");
  }
  const allChannelBoxes = [...document.querySelectorAll('.channelBoxClass')];

  const allButtons = [...document.querySelectorAll('.btn')];
  
  const allChannelBoxTitles = [...document.querySelectorAll('.channelBoxClass h5')];
  
  const allInputs = [...document.querySelectorAll('input')];

  const allLinks = [...document.querySelectorAll('#mainnavlist li')];

  const allScheduleTitles = [...document.querySelectorAll('.scheduleTopContainer h1')];
  
  /* ---------------- Dark mode toggle functionality and colors --------------- */
  if (localStorage.getItem("darkMode") === "dark"){
    body.style.backgroundColor = "	#1e2124";
    body.style.color = "#c5c5c5ff";
    mainHeader.style.backgroundColor = "#282b30";
    mainHeader.style.color = "#c5c5c5ff";
    mainContainer.style.backgroundColor = "#282b30";
    mainContainer.style.color = "#c5c5c5ff";
    player.style.backgroundColor = "#282b30";
    allChannelBoxes.forEach(channelBox => {
      channelBox.style.backgroundColor = "#242527ff"; 
    });
    allButtons.forEach(button => {
      button.style.backgroundColor = "#36393e";
      button.style.color = "#c5c5c5ff";
    });
    allChannelBoxTitles.forEach(channelBoxTitle => {
      channelBoxTitle.style.color = "#c5c5c5ff";
    });
    allInputs.forEach(input => {
      input.style.backgroundColor = "#36393e";
      input.style.borderColor = "#36393e";
      input.style.color = "#c5c5c5ff";
    });
    allScheduleTitles.forEach(scheduleTitle => {
      scheduleTitle.style.color = "#c5c5c5ff"
    });
    
    if(window.innerWidth <= 800){
      allLinks.forEach(link => {
        link.style.backgroundColor = "#242527ff";
      })
    }
    else{
      allLinks.forEach(link => {
        link.style.backgroundColor = "";
      })
    }
    const select = document.querySelector('select');
    select.style.backgroundColor = "#36393e";
    select.style.borderColor = "#36393e";
    select.style.color = "#c5c5c5ff";
    footer.style.color = "#a0a0a0ff";
  }
  
  else{
    body.style.backgroundColor = "";
    body.style.color = "";
    mainHeader.style.backgroundColor = "";
    mainHeader.style.color = "";
    mainContainer.style.backgroundColor = "";
    mainContainer.style.color = "";
    player.style.backgroundColor = "";
    allChannelBoxes.forEach(channelBox => {
      channelBox.style.backgroundColor = "#FAF9F6";
      channelBox.style.color = "rgb(95, 95, 95)"; 
    });
    allButtons.forEach(button => {
      button.style.backgroundColor = "";
      button.style.color = "";
    });
    allChannelBoxTitles.forEach(channelBoxTitle => {
      channelBoxTitle.style.color = "";
    });
    allInputs.forEach(input => {
      input.style.backgroundColor = "";
      input.style.borderColor = "";
      input.style.color = "";
    });
    allLinks.forEach(link => {
      link.style.backgroundColor = "";
    });
    allScheduleTitles.forEach(scheduleTitle => {
      scheduleTitle.style.color = "#D04900";
    });
    const select = document.querySelector('select');
    select.style.backgroundColor = "";
    select.style.borderColor = "";
    select.style.color = "";
    footer.style.color = "";
  }
}
