function getLabel(status) {

  return
  status === "viral" ? "Viral" :
  status === "hot" ? "Hot" :
  status === "champion" ? "Champion" :
  status === "hidden_gem" ? "Insider" :
  status === "rising" ? "Peak" :
  status === "falling" ? "Drop" :
  "Stable";

}

function getIcon(status) {

  return
  status === "viral" ? "🚀" :
  status === "hot" ? "🔥" :
  status === "champion" ? "👑" :
  status === "hidden_gem" ? "💎" :
  status === "rising" ? "▲" :
  status === "falling" ? "▼" :
  "●";

}

module.exports = {

  getLabel,
  getIcon

};
