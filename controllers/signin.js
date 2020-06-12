const jwt = require('jsonwebtoken')
const redis = require('redis')

// Setup Redis
console.log('Redis URI: ', process.env.REDIS_URI)
const redisClient = redis.createClient(process.env.REDIS_URI)

redisClient.on('error', function (error) {
  console.error(error)
})

const handleSignin = (db, bcrypt, req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return Promise.reject('incorrect form submission')
  }
  return db
    .select('email', 'hash')
    .from('login')
    .where('email', '=', email)
    .then((data) => {
      const isValid = bcrypt.compareSync(password, data[0].hash)
      if (isValid) {
        return db
          .select('*')
          .from('users')
          .where('email', '=', email)
          .then((user) => user[0])
          .catch((err) => Promise.reject('unable to get user'))
      } else {
        Promise.reject('wrong credentials')
      }
    })
    .catch((err) => Promise.reject('wrong credentials'))
}

const getAuthTokenId = (req, res) => {
  const { authorization } = req.headers
  return redisClient.get(authorization, (err, reply) => {
    if (err || !reply) {
      return res.status(400).json('Unauthorized')
    }
    return res.json({ id: reply })
  })
}

// Params: key = token, value = id
const setToken = (token, id) => {
  return Promise.resolve(redisClient.set(token, id))
}

const createSessions = (user) => {
  // create JWT Token & return user
  const { id, email } = user
  const token = signToken(email)
  return setToken(token, id)
    .then(() => {
      return { success: true, userId: id, token }
    })
    .catch(console.log)
}

const signToken = (email) => {
  const jwtPayload = { email }
  return jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '2 days' })
}

const signinAuthentication = (db, bcrypt) => (req, res) => {
  const { authorization } = req.headers

  return authorization
    ? getAuthTokenId(req, res)
    : handleSignin(db, bcrypt, req, res)
        .then((data) => {
          return data.id && data.email ? createSessions(data) : Promise.reject('Login Failed')
        })
        .then((session) => res.json(session))
        .catch((err) => res.status(400).json(err))
}

module.exports = {
  signinAuthentication: signinAuthentication,
  redisClient: redisClient,
}
