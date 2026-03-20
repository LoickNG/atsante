
-- Fix: restrict INSERT to only system/admin (trigger uses SECURITY DEFINER so bypasses RLS)
DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "Admin can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accueil'::app_role));

-- Allow delete own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE TO authenticated
USING (auth.uid() = user_id);
