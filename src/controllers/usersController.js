const { validationResult, body } = require('express-validator')
const bcryptjs = require('bcryptjs')
const db = require('../database/models/index')


const usersController = {
  //########### LOGIN ##########
  login: (req, res) => {
    res.render('./users/login');
  },

  //########### REGISTRAR USAURIO ###########
  register: (req, res) => {
    res.render('./users/register')
  },

  //############# CREAR USUARIO ############
  create: async (req, res) => {
    try {
      const results = await validationResult(req)
      if (!results.isEmpty()) {
        return res.render('./users/register', {
          errors: results.mapped(),
          oldData: req.body,
        })
      }


      delete req.body.repassword
      delete req.body.terms
      await db.User.create({
        ...req.body,
        password: bcryptjs.hashSync(req.body.password, 10),
        profileImg: req.file ? req.file.filename : 'default.jpg'
      })
        .then(data => {
          delete data.password;
          delete data.createdAt;
          delete data.updatedAt;
          req.session.userLogged = data.toJSON()
          return res.redirect('/')
        })
    } catch (error) {
      console.log(error)
    }
  },

  //############# REGISTRO EXITOSO ##############
  registerSuccessful: (req, res) => {
    res.render('./users/register_success')
  },


  // Procesando login
  loginValidation: async (req, res) => {
    try {
      const results = validationResult(req)
      if (!results.isEmpty()) {
        return res.render('./users/login', {
          errors: results.mapped(),
          oldData: req.body,
        })
      }

      let user = await db.User.findOne({ where: { email: req.body.email }, include: ['accountCart', 'Rol'] })
      let cleanData = user.toJSON();
      if (bcryptjs.compareSync(req.body.password, cleanData.password)) {
        delete cleanData.password
        delete cleanData.createdAt
        delete cleanData.updatedAt
        req.session.userLogged = cleanData

        if (req.body.rememberme) {
          res.cookie('token', req.body.email, { maxAge: (1000 * 60) * 60 })
        }

        return res.redirect('/')
      }
      return res.render('./users/login', {
        oldData: req.body,
        loginError: {
          msg: 'Los datos ingresados no son válidos'
        },
      })

    } catch (error) {
      //Pendiente realizar un manejador de errores
      console.log(error)
    }
  },

  profile: (req, res) => {
    console.log(req.session.userLogged)
    res.render('./users/profile', { user: req.session.userLogged });
  },

  updateProfile: async (req, res) => {
    try {
      let user = await db.User.findOne({ where: { id: req.params.id }, include: ['accountCart'] })
      let oldUserData = user.toJSON()
      let updatedData = {
        ...oldUserData,
        ...req.body
      }

      delete updatedData.password;

      if (req.file) {
        updatedData.profileImg = req.file.filename
      };

      
      await db.User.update(updatedData, {
        where: { id: req.params.id }
      });
      req.session.userLogged = updatedData;
      return res.redirect('/users/profile');

    } catch (error) {
      console.log(error)
      return res.send('Ooops! algo salio muy mal...')
    }
  },
  logout: (req, res) => {
    res.clearCookie('token');
    req.session.destroy();
    return res.redirect('/');
  },
}

module.exports = usersController