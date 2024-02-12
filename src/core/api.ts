import express, { Application, Router } from 'express';
import http from 'http';
import dotenv from 'dotenv'
import cors from 'cors';

import passport from 'passport';
import passwordJwt from 'passport-jwt';

const JwtStrategy = passwordJwt.Strategy;
const ExtractJwt = passwordJwt.ExtractJwt;

export const startAPI = (router: Router) => {
  const app: Application = express();

  dotenv.config();

  app.set('etag', false);
  app.use(cors());
  app.use(express.json());
  app.use(
    express.urlencoded({
      extended: true,
    }),
  );
  app.use(passport.initialize());

  passport.use("jwt", new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.TOKEN_SECRET || "",
      passReqToCallback: true,
    },
    (req, data, done) => {
      if (!data) {
        throw "INVALID TOKEN";
        // return done(null, null, { message: "Invalid token" });
      }

      req.user = data.data;
      return done(null, data.data);
    }
  ));

  app.use("/", cors(), router);

  const server = http.createServer(app);

  server.listen(5000);

  server.on('listening', () => {
    console.info('server up listening');
  });
};