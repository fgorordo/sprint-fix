const isAdmin = (req, res, next) => {
    if(req.session.userLogged.rolId !== 4) {
        return res.redirect('/');
    } else {
        next();
    }
}

module.exports = isAdmin;