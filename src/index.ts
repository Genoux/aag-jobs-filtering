import express from 'express'

const app = express()
const PORT = process.env.PORT || 3000

app.get('/', (_req, res) => {
    res.status(200).json({ status: 'ok' })
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})