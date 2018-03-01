// ==UserScript==
// @name     kgscripts
// @author   Zinsho Lexagen
// @version  1
// @include  http://bloodrizer.ru/games/kittens/
// @include  http://bloodrizer.ru/games/kittens/beta/
// @require  https://cdn.jsdelivr.net/npm/lodash@4.17.4/lodash.min.js
// @require  https://cdn.jsdelivr.net/npm/vue
// @require  https://unpkg.com/vuex
// @resource html script.html
// @grant    GM_getResourceText
// ==/UserScript==

$('body').append(GM_getResourceText("html"));
var gameDiv = document.getElementById("game");

if (gameDiv.getElementsByClassName("column").length == 3) {
  var scriptDiv = gameDiv.appendChild(document.createElement("div"));
  scriptDiv.setAttribute("id", "scripts");
  scriptDiv.setAttribute("class", "column");
}

function checkLoaded() {
  console.log("Checking for gamePage variable")
  if (typeof gamePage != 'undefined') {
    var root = document.getElementById('scripts');
    var tools = root.appendChild(document.createElement('tools'));
    var calcs = root.appendChild(document.createElement("calculations"));
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
        Priority: 5,
        Category: "Hunting"
      },
      {
        Name: "AutoBlueprint",
        Visible: true,
        Text: "Craft Blueprint %",
        Enabled: false,
        Effect: craftBlueprints,
        Value: 50,
        Priority: 4,
        Category: "Hunting"
      },
      {
        Name: "AutoPraise",
        Visible: true,
        Text: "Enable Auto Praising @ %",
        Enabled: true,
        Effect: autoPraise,
        Priority: 1,
        Category: "Religion",
        Value: 95
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

    Vue.component('tools', {
      template: "#tools"
    })

    Vue.component('smr-row', {
      template: '#smr-row',
      props: ['data'],
      computed: {
        strong: function () {
          return {
              'font-weight': this.data.isBold
          }
        }
      },
      filters: {
        toPercent: function (value) {
          if (!value) {
            return ''
          }
          var newVal = value.toLocaleString("en",{style: "percent",maximumFractionDigits: 2})
          return newVal
        }
      }
    }
    )

    Vue.component('calculations', {
      template: '#calculations'
    })

    Vue.component('obs-calc', {
      template: '#obs-calc',
      computed: {
        charts: function () {
          return this.$store.getters.chartsPerSecond
        }
      }
    })

    Vue.component('smr-calc', {
      template: '#smr-calc',
      computed: {
        smrData: function () {
          return this.$store.getters.getNextSMR
        }
      }
    })

    Vue.component('all-scripts', {
      template: '#all-scripts',
      props: ['category'],
      data: function () {
        return { scriptCategories: scriptCategories }
      }
    })

    Vue.component('group-scripts', {
      template: '#group-scripts',
      props: ['title', 'category'],
      data: function () {
        return { entries: availableScripts }
      }
    })

    Vue.component('enabled-object', {
      template: '#enabled-object',
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

    var store = new Vuex.Store({
      state: {
        test: "asdf",
        gameState: gamePage
      },
      getters: {
        getBuilding: state => {
          return building => state.gameState.bld.get(building)
        },
        getNextSMR: (state, getters) => {
          function getSMR(steam, mag, reactor) {
            return (1 + (mag * (0.02) * (1 + (0.15 * steam)))) * (1 + (0.05 * reactor))
          }
          var steam   = getters.getBuilding('steamworks'),          
              magneto = getters.getBuilding('magneto'),
              reactor = getters.getBuilding('reactor'),
              steamCount = steam.unlocked ? steam.on : 0,
              magCount   = magneto.unlocked ? magneto.on : 0,
              reactCount = reactor.unlocked ? reactor.on : 0;

          var curr = getSMR(steamCount,magCount,reactCount),
              nextSteam = getSMR(steam.unlocked ? steamCount + 1 : 0,
                                 magneto.unlocked ? magCount : 0,
                                 reactor.unlocked ? reactCount : 0 ) - curr,
              nextMagn = getSMR(steam.unlocked ? steamCount : 0, 
                                magneto.unlocked ? magCount + 1 : 0,
                                reactor.unlocked ? reactCount : 0 ) - curr,
              nextReact = getSMR(steam.unlocked ? steamCount : 0,
                                 magneto.unlocked ? magCount : 0,
                                 reactor.unlocked ? reactCount + 1 : 0 ) - curr,
              arr = [nextSteam, nextMagn, nextReact],
              max = Math.max(...arr),
              index = arr.indexOf(max),
              name = ['Steamworks','Magneto','Reactor'][index];

          return [
            {
              building: 'Steamworks',
              increase: nextSteam,
              count: steamCount,
              enabled: steam.unlocked,
              isBold: name === 'Steamworks' ? 'bold' : 'normal'
            },
            {
              building: 'Magneto',
              increase: nextMagn,
              count: magCount,
              enabled: magneto.unlocked,
              isBold: name === 'Magneto' ? 'bold' : 'normal'
            },
            {
              building: 'Reactor',
              increase: nextReact,
              count: reactCount,
              enabled: reactor.unlocked,
              isBold: name === 'Reactor' ? 'bold' : 'normal'
            }
          ]
        },
        getEffect: state => {
          return effect => state.gameState.getEffect(effect)
        },
        getPerk: state => {
          return perk => state.gameState.prestige.getPerk(perk)
        },
        chartsPerSecond: (state, getters) => {
          var scChance = getters.getEffect('starEventChance'),
              timeRatio = getters.getEffect('timeRatio'),
              haveAstromancy = getters.getPerk('astromancy').unlocked,
              haveChronomancy = getters.getPerk('chronomancy').unlocked;
          
          var chanceRatio = (haveChronomancy ? 1.1 : 1) * (1 + (timeRatio * 0.25)),
              varChance = (25 + (scChance * 10000)) * (haveAstromancy ? 2 : 1),
              chancePerSecond = chanceRatio * varChance / 10000 / 2,
              chartsPerSecond = Math.min(0.5, chancePerSecond)
          return chartsPerSecond
        }
      },
      modules: {
        vueState: {
          state: {},

        }
      }
    })
    var scripts = new Vue({
      el: '#scripts',
      data: {
        scriptCategories: scriptCategories,
        entries: availableScripts,
      },
      store
    })

    window.vue = scripts

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
      var threshhold = availableScripts.find(x=> x.Name === "AutoPraise").Value / 100

      if (faith.value / faith.maxValue > threshhold) {
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
        if (useCraftAll) { console.log("Crafting all " + craftResource) } else { console.log("Crafting " + minCraft + " " + craftResource) }
        useCraftAll ? gamePage.craftAll(craftResource) : gamePage.workshop.craft(craftResource, minCraft)
      }
    }

  } else {
    setTimeout(checkLoaded,1000)
  }
}
setTimeout(checkLoaded, 1000)