document.querySelectorAll('[role="tab"]').forEach(ele => {
  ele.addEventListener('click', event => {
    let targetId = event.target.getAttribute('aria-controls')
    let targetEle = document.querySelector(`#${targetId}`)

    document.querySelectorAll(['[role="tabpanel"]']).forEach(tp => {
      tp.classList.toggle('hidden', true)
    })

    targetEle.classList.toggle('hidden', false)

    document.querySelectorAll(['[role="tab"]']).forEach(t => {
      t.setAttribute('aria-selected', false)
    })

    event.target.setAttribute('aria-selected', true)
  })
})