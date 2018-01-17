// ==UserScript==
// @name     kgscripts
// @author   Zinsho Lexagen
// @version  1
// @include  http://bloodrizer.ru/games/kittens/
// @include  http://bloodrizer.ru/games/kittens/beta/
// @require  https://cdn.jsdelivr.net/npm/lodash@4.17.4/lodash.min.js
// @require  https://cdn.jsdelivr.net/npm/vue
// @resource html script.html
// @grant    none
// ==/UserScript==

//$('body').append(GM_getResourceText("html"));
var gameDiv = document.getElementById("game");

if (gameDiv.getElementsByClassName("column").length == 3) {
  var scriptDiv = gameDiv.appendChild(document.createElement("div"));
  scriptDiv.setAttribute("id", "scripts");
  scriptDiv.setAttribute("class", "column");
}

var root = document.getElementById('scripts');
var templ = root.appendChild(document.createElement('all-scripts'));
templ.setAttribute(":scriptCategories", "scriptCategories")

var scriptsRunning

const scriptCategories = [
  {
    Title: "Global Settings",
    Category: "Global"
  },
  {
    Title: "Hunting Scripts",
    Category: "Hunting"
  },
  {
    Title: "Religion Scripts",
    Category: "Religion"
  },
  {
    Title: "Other Scripts",
    Category: "Other"
  }
]

const availableScripts = [
  // Global Settings
  {
    Name: "Enabled",
    Visible: true,
    Text: "Scripts Enabled",
    Enabled: false,
    Parameter: "scriptsEnabled",
    Category: "Global"
  },
  {
    Name: "Frequency",
    Visible: true,
    Text: "Frequency (seconds)",
    Enabled: null,
    Parameter: "scriptFrequency",
    Value: 5,
    Category: "Global"
  },
  // Scripts
  {
    Name: "AutoHunt",
    Visible: true,
    Text: "Enable Autohunting",
    Enabled: true,
    Effect: sendHunters,
    Priority: 1,
    Category: "Hunting"
  },
  {
    Name: "AutoParchment",
    Visible: true,
    Text: "Craft Parchment",
    Enabled: false,
    Effect: craftParchment,
    Priority: 2,
    Category: "Hunting"
  },
  {
    Name: "AutoManuscript",
    Visible: true,
    Text: "Craft Manuscript % ",
    Enabled: false,
    Effect: craftManuscripts,
    Value: 50,
    Priority: 3,
    Category: "Hunting"
  },
  {
    Name: "AutoCompedium",
    Visible: true,
    Text: "Craft Compendium %",
    Enabled: false,
    Effect: craftCompendiums,
    Value: 50,
    Priority: 4,
    Category: "Hunting"
  },
  {
    Name: "AutoBlueprint",
    Visible: true,
    Text: "Craft Blueprint %",
    Enabled: false,
    Effect: craftBlueprints,
    Value: 50,
    Priority: 5,
    Category: "Hunting"
  },
  {
    Name: "AutoPraise",
    Visible: true,
    Text: "Enable Auto Praising",
    Enabled: true,
    Effect: autoPraise,
    Priority: 1,
    Category: "Religion"
  },
  {
    Name: "Auto Observe",
    Visible: true,
    Text: "Enable Auto Observation of Starcharts",
    Enabled: true,
    Effect: autoObserve,
    Priority: 1,
    Category: "Other"
  }
]

var enabledScripts = new Set();

Vue.directive("hidden", {
  bind: function (el, binding, vnode) {
    if (!binding.value) {
      el.style.visibility = "hidden";
    }
  }
})

Vue.component('all-scripts', {
  template: '<div><div v-for="group in scriptCategories"><group-scripts :title="group.Title" :category="group.Category"></group-scripts></div></div>',
  props: ['category'],
  data: function () {
    return { scriptCategories: scriptCategories }
  }
})

Vue.component('group-scripts', {
  template: '<div><h2>{{ title }}</h2><div v-for="entry in entries" v-if="entry.Visible && entry.Category === category"><enabled-object :entry="entry"></enabled-object></div></div>',
  props: ['title', 'category'],
  data: function () {
    return { entries: availableScripts }
  }
})

Vue.component('enabled-object', {
  template: '<div><input type="checkbox" v-bind:checked="entry.Enabled" :name="entry.Name" v-on:click="addEntry" style="display: contents !important;" v-hidden="entry.Enabled != null":id="enabledID"><label style="content: none !important;" v-bind:for="entry.Name">{{ entry.Text }}</label><input type="number" min="1" max="100" v-bind:value="entry.Value" :name="entry.Name" v-if="entry.Value" :id="ValueID" v-on:change.stop="updateValue"></div>#enabled-object',
  props: ['entry'],
  computed: {
    enabledID: function () {
      return "en-" + this.entry.Name
    },
    ValueID: function () {
      return "val-" + this.entry.Name
    },
    inGroup: function () {
      if (this.entry.Category === this.category) {
        return true
      } else {
        return false
      }
    }
  },
  methods: {
    addEntry(entry) {
      if (this.entry.Category === 'Global') {
        toggleScripts(this.$el.children[this.enabledID].checked)
        return
      }
      if (this.$el.children[this.enabledID].checked) {
        enabledScripts.add(this.entry.Name)
      } else {
        enabledScripts.delete(this.entry.Name)
      }
    },
    updateValue(entry) {
      var propName = this.entry.Name,
        Value = this.entry.Value,
        currValue = this.$el.children[this.ValueID].value
      availableScripts.filter(x => x.Name === propName)
        .forEach(function (n) {
          n.Value = currValue
        })
    }
  },
  mounted: function () {
    this.addEntry()
  }
})

var scripts = new Vue({
  el: '#scripts',
  data: {
    scriptCategories: scriptCategories,
    entries: availableScripts,
  }
})


// Script Functions
function sendHunters() {
  var catpower = gamePage.resPool.get('manpower');
  if (catpower.value / catpower.maxValue > 0.95) {
    $("a:contains('Send hunters')").click();
  }
}

function craftParchment() {
  if (gamePage.workshop.getCraft('parchment').unlocked) {
    gamePage.craftAll('parchment');
  }
}

function craftManuscripts() {
  calculateCraft('manuscript', 'parchment')
}

function craftBlueprints() {
  calculateCraft('blueprint', 'compedium')
}

function craftCompendiums() {
  calculateCraft('compedium', 'manuscript')
}

function autoPraise() {
  var faith = gamePage.resPool.get('faith');

  if (faith.value / faith.maxValue > 0.95) {
    $("a:contains('Praise the sun')").click();
  }
}

function autoObserve() {
  var starChart = $('#observeBtn')

  if (starChart[0]) {
    starChart.click()
  }
}

// Run all scripts
function toggleScripts(enable) {
  if (enable) {
    var seconds = availableScripts.find(x => x.Name === "Frequency").Value
    console.log("Setting scripts to run every " + seconds + " seconds");
    var scriptIntervalCounter = 0;
    scriptsRunning = setInterval(function () {
      var seconds = availableScripts.find(x => x.Name === "Frequency").Value
      if (!(scriptIntervalCounter % seconds)) {
        runScripts()
        scriptIntervalCounter = 1
      } else { scriptIntervalCounter++ }
    }, 1000)
  } else {
    console.log("Stopping scripts");
    clearInterval(scriptsRunning);
  }
}

function runScripts() {
  // create list of active scripts to run
  var tempArray = Array.from(enabledScripts)
  console.log("Scripts Executing... " + tempArray.join(', '))
  var toRun = availableScripts.map(
    function (n) {
      if (tempArray.filter(b => b === n.Name)[0]) {
        return n
      }
    }).filter(x => x != null).sort(
    function (a, b) {
      return a.Priority - b.Priority;
    }
    )
  toRun.forEach(function (run) {
    run.Effect()
  })
}

// Craft Calculations
function getMinCraft(craft) {
  var prices = craft.prices,
    min = prices.map(function (x) {
      var pName = x.name,
        pVal = x.val,
        pAmt = gamePage.resPool.get(pName).value;
      return Math.floor(pAmt / pVal)
    })
  return min;
}

function calculateCraft(craftResource, fromResource) {
  console.log("Calculating craft for: " + craftResource)
  var findCraft = gamePage.workshop.getCraft(craftResource),
    fromAmount = gamePage.resPool.get(fromResource).value,
    optName = "Auto" + craftResource.charAt(0).toUpperCase() + craftResource.slice(1),
    craftPercent = availableScripts.find(x => x.Name === optName).Value,
    price = findCraft.prices.find(x => x.name === fromResource).val,
    craftCount = Math.floor((fromAmount * craftPercent / 100) / price),
    minPossible = getMinCraft(findCraft),
    useCraftAll = craftPercent >= 100;
  minPossible.push(craftCount);
  var minCraft = Math.min(...minPossible);
  if (findCraft.unlocked) {
    if (useCraftAll) {console.log("Crafting all "+craftResource)} else {console.log("Crafting "+minCraft+" "+craftResource)}
    useCraftAll ? gamePage.craftAll(craftResource) : gamePage.workshop.craft(craftResource, minCraft)
  }
}
