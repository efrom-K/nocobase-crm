create or replace function nb_purge_read_inapp() returns trigger language plpgsql as $$
begin
  delete from "notificationInAppMessages" where id = new.id;
  return null;
end $$;
drop trigger if exists nb_purge_read_inapp on "notificationInAppMessages";
create trigger nb_purge_read_inapp after update of status on "notificationInAppMessages"
  for each row when (new.status = 'read') execute function nb_purge_read_inapp();
