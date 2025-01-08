const { json } = require("express")
const express = require("express") // Common JS\
const cors = require('cors')
const z = require('zod')
const movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require("./schemas/movie")
const app = express()
app.use(express.json())
app.disable('x-powered-by') //Deshabilitar el header "X-Powered-By: Express"

//SOLUCION AL PROBLEMA "CORS" --> ACCESS CONTROL ALLOW ORIGIN:
app.use(cors({
    origin: (origin, callback) =>{
        const ACCEPTED_ORIGINS = [
            'http://localhost:8080',
            'http://localhost:1234',
            'http://localhost:3000',
            
        ]
    //LA CABECERA "ORIGIN" NO EXISTE CUANDO ES EL MISMO DOMINIO EL QUE REALIZA LA PETICION
    //EN ESE CASO, EL PROBLEMA A RESOLVER YA NO SERIA UN "CORS"
        if(ACCEPTED_ORIGINS.includes(origin)){
            return callback(null, true)
        }
        if(!origin){
            return callback(null, true)
        }
        return callback(new Error('Not allowed by CORS'))
    }
}))


//Todos los recursos que sean movies se identifican con '/movies'


app.get('/movies/:id', (req, res) => { //path-to-regexp
    const { id } = req.params
    const movie = movies.find(movie => movie.id === id)
    if(movie) return res.json(movie)

    res.status(404).json({ message: "not found"})
})

//Filtrar por genero
app.get('/movies', (req, res) => {

    const{ genre } = req.query
    if(genre){
        const filteredMovies = movies.filter(
            movie => movie.genre.some(g => g.toLowerCase() == genre.toLowerCase())
        )
        return res.json(filteredMovies)
    }
    res.json(movies)
})

app.post('/movies', (req, res) =>{

    const result = validateMovie(req.body)

    if(result.error){
        return res.status(400).json({ error: JSON.parse(result.error.message) })
    }
    
    const newMovie = {
        id: crypto.randomUUID(), // UUID --> universal unique identifier
        ...result.data
    }

    //Esto no seria REST porque estariamos guuardando
    //el estado de la aplicacion en memoria
    movies.push(newMovie)

    res.status(201).json(newMovie)
}

)
app.delete('/movies/:id', (req, res) => {
    const origin = req.header('origin')
    if(ACCEPTED_ORIGINS.includes(origin) || !origin){
        res.header('Access-Control-Allow-Origin', origin)
    }

    const { id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if(movieIndex === -1){
        return res.status(404).json({ message: 'Movie not found' })
    }
    
    movies.splice(movieIndex, 1)

    return res.json( { message: 'Movie deleted' } )
})

app.patch('/movies/:id', (req, res) =>{
    const result = validatePartialMovie(req.body)
    if(result.error){
        return res.status(400).json({ error: JSON.parse(result.error.message) })
    }

    const { id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)
    
    if (movieIndex == -1) {
        return res.status(404).json( { message: "Movie not found" })
    }

    const updateMovie = {
        ...movies[movieIndex],
        ...result.data
    }


    movies[movieIndex] = updateMovie
})

app.options('/movies/:id', (req, res) => {
    const origin = req.header('origin')
    if(ACCEPTED_ORIGINS.includes(origin) || !origin){
        res.header('Access-Control-Allow-Origin', origin)
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
    }
    res.send(200)
})

const PORT = process.env.PORT ?? 1234;
app.listen(PORT, () => {
    console.log(`Server listening on port http://localhost:${PORT}`);
})