-- Live GPS: the fleet map subscribes to driver_locations inserts (filtered by
-- trip_id) via Supabase Realtime instead of polling the API.
-- RLS still applies: staff_read_driver_locations lets authenticated staff read.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL; -- already in the publication
END $$;
