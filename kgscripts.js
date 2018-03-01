FileReader

var root = document.getElementById('scripts');
var templ = root.appendChild(document.createElement('all-scripts'));
templ.setAttribute(":scriptCategories","scriptCategories")
templ.setAttribute("v-show","visible")

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
    Enabled: false,
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
    Text: "Enable Auto Praising",
    Enabled: false,
    Effect: autoPraise,
    Priority: 4,
    Category: "Religion"
  }
]

var enabledScripts = new Set();

Vue.directive("hidden", {
  bind: function (el,binding,vnode) {
    if (!binding.value) {
      el.style.visibility = "hidden";
    }
  }
})

Vue.component('nav-button', {
  template: "#nav-button",
  props: ['state'],
  methods: {
    toggleVisibility: function () {
      this.$emit('toggled')
    }
  }
}
)
Vue.component('all-scripts', {
  template: "#all-scripts",
  props: ['category'],
  data: function () {
    return { scriptCategories: scriptCategories }
  }
})

Vue.component('group-scripts', {
  template: '#script-group',
  props: ['title','category'],
  data: function () {
    return {entries: availableScripts}
  }
})

Vue.component('enabled-object', {
  template: '#enabled-object',
  props: ['entry'],
  computed: {
    enabledID: function () {
      return "en-"+this.entry.Name
    },
    ValueID: function () {
      return "val-"+this.entry.Name
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
        toggleScripts(this.$el.firstChild.checked)
        return
      }
      if (this.$el.firstChild.checked) {
        enabledScripts.add(this.entry.Name)
      } else {
        enabledScripts.delete(this.entry.Name)
      }
    },
    updateValue(entry) {
      var propName = this.entry.Name,
          Value  = this.entry.Value,
          currValue = this.$el.children[this.ValueID].value      
      availableScripts.filter(x=>x.Name===propName)
      .forEach(function (n){
        n.Value=currValue
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
    state: "Closed",
    visible: false
  },
  methods: {
    toggleScripts: function () {
      console.log("test")
      if (this.state == "Open") {
        this.state = "Closed"
      } else {
        this.state = "Open"
      }
      this.visible = !this.visible
    }
  }
})


// Script Functions
function sendHunters () {
  var catpower = gamePage.resPool.get('manpower');
  if (catpower.value / catpower.maxValue > 0.95) {
    $("a:contains('Send hunters')").click();
  }
}

function craftParchment () {
  console.log("Parchment")
}

function craftManuscripts (percent) {
  console.log("Craft "+percent)
}

function craftBlueprints (percent) {}

function autoPraise () {
  var faith = gamePage.resPool.get('faith');

  if (faith.value / faith.maxValue > 0.95) {
      $("a:contains('Praise the sun')").click();
  }
}

// Run all scripts
function toggleScripts (enable) {
  if (enable) {
    var seconds = availableScripts.find(x=>x.Name==="Frequency").Value
    console.log("Setting scripts to run every "+seconds+" seconds");
    var i = 0;
    scriptsRunning = setInterval(function () {
      var seconds = availableScripts.find(x=>x.Name==="Frequency").Value
      if (!(i%seconds)) {
        runScripts()
        i = 1
      } else {i++ }
    }, 1000)
  } else {
    console.log("Stopping scripts");
    clearInterval(scriptsRunning);
  }
}

function runScripts () {
  // create list of active scripts to run
  var tempArray = Array.from(enabledScripts)
  console.log("Scripts Executing... "+tempArray.join(', '))
  var toRun = availableScripts.map(
    function (n) {
      if (tempArray.filter(b => b === n.Name)[0]) {
        return n
      }
    }).filter(x => x != null).sort(
      function(a,b) {
        return a.Priority - b.Priority;
      }
    )
  toRun.forEach(function (run) {
    run.Effect(run.Value)
  })
}