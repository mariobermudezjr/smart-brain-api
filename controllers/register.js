const jwt = require('jsonwebtoken')
const redisClient = require('./signin').redisClient

const createSessions = (user) => {
  // create JWT Token & return user

  const { id, email } = user
  const token = signToken(email)
  return setToken(token, id)
    .then(() => {
      return token
    })
    .catch(console.log)
}

// Params: key = token, value = id
const setToken = (token, id) => {
  return Promise.resolve(redisClient.set(token, id))
}

const signToken = (email) => {
  const jwtPayload = { email }
  return jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '2 days' })
}

const handleRegister = (req, res, db, bcrypt) => {
  const { email, name, password } = req.body
  if (!email || !name || !password) {
    return res.status(400).json('incorrect form submission')
  }
  const hash = bcrypt.hashSync(password)
  db.transaction((trx) => {
    trx
      .insert({
        hash: hash,
        email: email,
      })
      .into('login')
      .returning('email')
      .then((loginEmail) => {
        return trx('users')
          .returning('*')
          .insert({
            email: loginEmail[0],
            name: name,
            joined: new Date(),
          })

          .then(async (user) => {
            const token = await createSessions(user[0])
            res.json({ user: user[0], token: token })
          })
          .then(trx.commit)
      })

      .catch(trx.rollback)
  }).catch((err) => res.status(400).json('unable to register'))
}

module.exports = {
  handleRegister: handleRegister,
}
