// One-time admin setup page - Add first admin email
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ref, set, get } from "firebase/database";
import { database } from "@/services/firebase";
import { toast } from "sonner";
import EmailIcon from "@mui/icons-material/Email";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const AdminSetup = () => {
  const [email, setEmail] = useState("mattycycling@gmail.com");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAddAdmin = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      
      // Check if adminEmails node exists, if not create it
      const adminEmailsRef = ref(database, "adminEmails");
      const snapshot = await get(adminEmailsRef);
      
      // Add the email
      const emailRef = ref(database, `adminEmails/${email}`);
      await set(emailRef, true);
      
      toast.success(`Admin email ${email} added successfully!`);
      setSuccess(true);
    } catch (error: any) {
      console.error("Error adding admin email:", error);
      toast.error(`Failed to add admin email: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      const emailRef = ref(database, `adminEmails/${email}`);
      const snapshot = await get(emailRef);
      
      if (snapshot.exists() && snapshot.val() === true) {
        toast.success("Admin email is already set up!");
        setSuccess(true);
      } else {
        toast.info("Admin email not found. Please add it.");
        setSuccess(false);
      }
    } catch (error: any) {
      console.error("Error verifying:", error);
      toast.error("Failed to verify admin email");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-primary/10 via-background to-success/10">
        <Card className="p-8 max-w-md w-full text-center space-y-4">
          <CheckCircleIcon className="mx-auto text-success" style={{ fontSize: 64 }} />
          <h1 className="text-2xl font-bold">Admin Email Added!</h1>
          <p className="text-muted-foreground">
            The email <strong>{email}</strong> has been successfully added as an admin.
          </p>
          <div className="space-y-2 pt-4">
            <p className="text-sm text-muted-foreground">Next steps:</p>
            <ol className="text-sm text-left space-y-1 list-decimal list-inside">
              <li>Go to <code className="bg-muted px-1 rounded">/admin/login</code></li>
              <li>Sign in with <strong>{email}</strong></li>
              <li>You'll be redirected to the admin dashboard</li>
            </ol>
          </div>
          <Button onClick={() => window.location.href = "/admin/login"} className="w-full mt-4">
            Go to Admin Login
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setSuccess(false);
              setEmail("");
            }}
            className="w-full"
          >
            Add Another Email
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-primary/10 via-background to-destructive/10">
      <Card className="p-8 max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Admin Setup</h1>
          <p className="text-muted-foreground">
            Add your first admin email to Firebase Database
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="admin-email" className="text-sm font-medium">
              Admin Email Address
            </label>
            <div className="relative">
              <EmailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }} />
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAddAdmin}
              disabled={loading || !email}
              className="flex-1"
            >
              {loading ? "Adding..." : "Add Admin Email"}
            </Button>
            <Button
              variant="outline"
              onClick={handleVerify}
              disabled={loading}
            >
              Verify
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t space-y-2">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> This page can be deleted after setup. It's a one-time setup tool.
          </p>
          <p className="text-xs text-muted-foreground">
            Make sure you're authenticated with Firebase (logged in to the app) for this to work.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AdminSetup;

