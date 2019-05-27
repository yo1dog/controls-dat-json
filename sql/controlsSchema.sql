DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;


CREATE TABLE meta (
  description  TEXT        NOT NULL CHECK(char_length(description) > 0),
  version      TEXT        NOT NULL CHECK(char_length(version) > 0),
  time         TIMESTAMPTZ NOT NULL,
  generated_by TEXT        NOT NULL
);

CREATE TABLE game (
  name                   TEXT    NOT NULL PRIMARY KEY CHECK(name SIMILAR TO '[a-z0-9]+'),
  description            TEXT    NOT NULL CHECK(char_length(description) > 0),
  num_players            INTEGER NOT NULL CHECK(num_players > 0),
  alternates_turns       BOOLEAN NOT NULL,
  uses_service_buttons   BOOLEAN NOT NULL,
  uses_tilt              BOOLEAN NOT NULL,
  has_cocktail_dipswitch BOOLEAN NOT NULL,
  notes                  TEXT    NOT NULL,
  errors                 TEXT[]  NOT NULL
);


CREATE TYPE cabinet_type AS ENUM ('upright', 'cocktail');
CREATE TABLE control_config (
  id                        TEXT         NOT NULL PRIMARY KEY,
  game_name                 TEXT         NOT NULL REFERENCES game(name),
  target_cabinet_type       cabinet_type NOT NULL,
  requires_cocktail_cabinet BOOLEAN      NOT NULL,
  notes                     TEXT         NOT NULL
);
CREATE TABLE control_config_menu_button (
  control_config_id TEXT NOT NULL REFERENCES control_config(id),
  descriptor        TEXT          CHECK(char_length(descriptor) > 0),
  label             TEXT          CHECK(char_length(label) > 0),
  mame_input_port   TEXT          CHECK(char_length(mame_input_port) > 0)
);

CREATE TABLE control_set (
  id                         TEXT      NOT NULL PRIMARY KEY,
  control_config_id          TEXT      NOT NULL REFERENCES control_config(id),
  supported_player_nums      INTEGER[] NOT NULL CHECK(array_length(supported_player_nums, 1) > 0),
  is_required                BOOLEAN   NOT NULL,
  is_on_opposite_screen_side BOOLEAN   NOT NULL
);
CREATE TABLE control_config_control_pannel_button (
  control_set_id  TEXT NOT NULL REFERENCES control_set(id),
  descriptor      TEXT          CHECK(char_length(descriptor) > 0),
  label           TEXT          CHECK(char_length(label) > 0),
  mame_input_port TEXT          CHECK(char_length(mame_input_port) > 0)
);

CREATE TABLE control (
  id             TEXT NOT NULL PRIMARY KEY,
  control_set_id TEXT NOT NULL REFERENCES control_set(id),
  type           TEXT NOT NULL CHECK(char_length(type) > 0),
  descriptor     TEXT          CHECK(char_length(descriptor) > 0)
);
CREATE TABLE control_button (
  control_id      TEXT NOT NULL REFERENCES control(id),
  descriptor      TEXT          CHECK(char_length(descriptor) > 0),
  label           TEXT          CHECK(char_length(label) > 0),
  mame_input_port TEXT          CHECK(char_length(mame_input_port) > 0)
);

CREATE TABLE control_output (
  id         TEXT NOT NULL PRIMARY KEY,
  control_id TEXT NOT NULL REFERENCES control(id),
  output_key TEXT NOT NULL CHECK(char_length(output_key) > 0),
  UNIQUE(control_id, output_key)
);
CREATE TABLE control_ouput_input (
  control_output_id TEXT    NOT NULL PRIMARY KEY REFERENCES control_output(id),
  is_analog         BOOLEAN NOT NULL,
  mame_input_port   TEXT             CHECK(char_length(mame_input_port) > 0),
  label             TEXT             CHECK(char_length(label) > 0),
  neg_label         TEXT             CHECK(char_length(neg_label) > 0),
  pos_label         TEXT             CHECK(char_length(pos_label) > 0)
);