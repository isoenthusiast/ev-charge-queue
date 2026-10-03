import htmx from 'htmx.org'
htmx.config.allowEval = false
htmx.config.allowScriptTags = false
htmx.config.selfRequestsOnly = true
document.addEventListener('htmx:beforeSwap', (event) => {
  if (event.detail.xhr.status === 422) {
    event.detail.shouldSwap = true
    event.detail.isError = false
  }
})
for (const name of ['htmx:sendError', 'htmx:responseError']) {
  document.addEventListener(name, () => {
    const alert = document.querySelector('#network-error')
    if (alert) alert.hidden = false
  })
}
document.addEventListener('htmx:beforeRequest', () => {
  const alert = document.querySelector('#network-error')
  if (alert) alert.hidden = true
})
