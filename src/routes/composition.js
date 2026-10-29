let { sendCompositionChange, state } = require("../socket")

function get(_, res) {
    return res.json(state.currentComposition)
}

function post(req, res) {
    let newComposition = req.body
    const changes = computeChanges(newComposition)
    state.currentComposition = req.body

    res.status(200).json({ message: 'Composition updated successfully' })
    sendCompositionChange(changes)
}

function computeChanges(newComposition) {
    let newPovs = newComposition.filter(pov => !state.currentComposition.some(currentPov => currentPov.uuid === pov.uuid))
    let removedPovs = state.currentComposition.filter(pov => !newComposition.some(newPov => newPov.uuid === pov.uuid))

    let changes = []
    let newIndex = 0

    for (let pov of removedPovs) {
        if (newPovs.length > newIndex) {
            let replacement = newPovs[newIndex]
            changes.push({ type: 'replace', old: pov, new: replacement })
            newIndex++
        } else {
            changes.push({ type: 'remove', pov })
        }
    }
    for (; newIndex < newPovs.length; newIndex++) {
        changes.push({ type: 'add', pov: newPovs[newIndex] })
    }

    return changes
}

module.exports = {
    get,
    post
}
