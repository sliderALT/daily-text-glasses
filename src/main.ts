import {
  waitForEvenAppBridge,
  TextContainerProperty,
  CreateStartUpPageContainer,
  OsEventTypeList,
} from '@evenrealities/even_hub_sdk'

async function main(): Promise<void> {
  const statusEl = document.getElementById('status')
  function setStatus(msg: string) {
    if (statusEl) statusEl.textContent = msg
    console.log(msg)
  }

  setStatus('Fetching daily text...')

  let glassesText = 'Could not load daily text.'
  try {
    const resp = await fetch('/daily-text.json')
    if (resp.ok) {
      const json = await resp.json()
      glassesText = json.text
      setStatus('Text ready ✓ Connecting to glasses...')
    } else {
      setStatus('Fetch failed: ' + resp.status)
    }
  } catch (err) {
    setStatus('Fetch error: ' + String(err))
  }

  const bridge = await waitForEvenAppBridge()
  setStatus('Bridge ready ✓ Rendering...')

  const result = await bridge.createStartUpPageContainer(
    new CreateStartUpPageContainer({
      containerTotalNum: 1,
      textObject: [new TextContainerProperty({
        xPosition: 0,
        yPosition: 0,
        width: 576,
        height: 288,
        containerID: 1,
        containerName: 'main',
        content: glassesText,
        borderWidth: 0,
        borderColor: 5,
        borderRadius: 0,
        paddingLength: 6,
        isEventCapture: 1,
      })],
    })
  )

  setStatus('Done ✓  Result: ' + result)

  bridge.onEvenHubEvent(async event => {
    const e = event.textEvent
    if (!e) return
    if (e.eventType === OsEventTypeList.FOREGROUND_ENTER_EVENT) {
      await bridge.createStartUpPageContainer(
        new CreateStartUpPageContainer({
          containerTotalNum: 1,
          textObject: [new TextContainerProperty({
            xPosition: 0,
            yPosition: 0,
            width: 576,
            height: 288,
            containerID: 1,
            containerName: 'main',
            content: glassesText,
            borderWidth: 0,
            borderColor: 5,
            borderRadius: 0,
            paddingLength: 6,
            isEventCapture: 1,
          })],
        })
      )
    }
  })
}

main().catch(err => {
  const statusEl = document.getElementById('status')
  if (statusEl) statusEl.textContent = 'Fatal: ' + String(err)
})
