import { BaseSchema } from '@adonisjs/lucid/schema'
export default class extends BaseSchema {
  async up() {
    this.schema.raw(`
      CREATE TABLE locations (id serial PRIMARY KEY, name varchar(100) NOT NULL, timezone varchar(80) NOT NULL DEFAULT 'Asia/Kuala_Lumpur', created_by integer NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now());
      CREATE TABLE location_members (location_id integer NOT NULL REFERENCES locations(id) ON DELETE CASCADE, user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE, role varchar(10) NOT NULL CHECK(role IN ('member','admin')), PRIMARY KEY(location_id,user_id));
      CREATE TABLE cars (id serial PRIMARY KEY, user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE, plate varchar(20) NOT NULL, label varchar(60) NOT NULL, UNIQUE(user_id,plate));
      CREATE TABLE chargers (id serial PRIMARY KEY, location_id integer NOT NULL REFERENCES locations(id) ON DELETE CASCADE, name varchar(80) NOT NULL, connector varchar(40) NOT NULL, power_kw numeric(6,1) NOT NULL CHECK(power_kw > 0 AND power_kw <= 1000), status varchar(20) NOT NULL DEFAULT 'available' CHECK(status IN ('available','maintenance','faulty')), UNIQUE(location_id,name));
      CREATE TABLE bookings (id serial PRIMARY KEY, charger_id integer NOT NULL REFERENCES chargers(id) ON DELETE CASCADE, car_id integer NOT NULL REFERENCES cars(id), user_id integer NOT NULL REFERENCES users(id), slot_start timestamptz NOT NULL, state varchar(20) NOT NULL DEFAULT 'booked' CHECK(state IN ('booked','charging','completed','released','cancelled')), started_at timestamptz, ended_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), CHECK(mod(extract(epoch from slot_start)::numeric,1800)=0), CHECK(ended_at IS NULL OR (started_at IS NOT NULL AND ended_at >= started_at)), CHECK(state <> 'charging' OR (started_at IS NOT NULL AND ended_at IS NULL)), CHECK(state <> 'completed' OR (started_at IS NOT NULL AND ended_at IS NOT NULL)));
      CREATE UNIQUE INDEX charger_slot_reserved ON bookings(charger_id,slot_start) WHERE state IN ('booked','charging','completed');
      CREATE UNIQUE INDEX car_slot_reserved ON bookings(car_id,slot_start) WHERE state IN ('booked','charging','completed');
      CREATE UNIQUE INDEX charger_one_session ON bookings(charger_id) WHERE state = 'charging';
      CREATE UNIQUE INDEX car_one_session ON bookings(car_id) WHERE state = 'charging';
      CREATE INDEX booking_user ON bookings(user_id,slot_start);
      CREATE TABLE fault_reports (id serial PRIMARY KEY, charger_id integer NOT NULL REFERENCES chargers(id) ON DELETE CASCADE, reporter_id integer NOT NULL REFERENCES users(id), description varchar(1000) NOT NULL, state varchar(20) NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','verified','dismissed')), reviewed_by integer REFERENCES users(id), resolution varchar(1000), created_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz);
      CREATE TABLE charging_audit (id serial PRIMARY KEY, location_id integer NOT NULL REFERENCES locations(id) ON DELETE CASCADE, actor_id integer NOT NULL REFERENCES users(id), action varchar(80) NOT NULL, detail text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
    `)
  }
  async down() {
    this.schema.raw(
      'DROP TABLE charging_audit, fault_reports, bookings, chargers, cars, location_members, locations'
    )
  }
}
