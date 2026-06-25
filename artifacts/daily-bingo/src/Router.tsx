import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Redirect, Route, Switch, useLocation } from "wouter";
import Home from "@/pages/home";
import Login from "@/pages/login";

// We'll import these once we generate them
import Dashboard from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminParticipants from "@/pages/admin/participants";
import AdminParticipantDetail from "@/pages/admin/participant-detail";
import AdminCardNew from "@/pages/admin/card-new";
import AdminCardEdit from "@/pages/admin/card-edit";
import AdminReflections from "@/pages/admin/reflections";
import { Spinner } from "@/components/ui/spinner";

function ProtectedRoute({ component: Component, roleRequired, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner className="w-8 h-8" /></div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (roleRequired && user.role !== roleRequired) {
    return <Redirect to="/" />;
  }

  return <Component {...rest} />;
}

export default function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />

      {/* Participant Routes */}
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} roleRequired="participant" />}
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminDashboard} roleRequired="admin" />}
      </Route>
      <Route path="/admin/participants">
        {() => <ProtectedRoute component={AdminParticipants} roleRequired="admin" />}
      </Route>
      <Route path="/admin/participants/:id">
        {(params) => <ProtectedRoute component={AdminParticipantDetail} roleRequired="admin" id={params.id} />}
      </Route>
      <Route path="/admin/cards/new">
        {() => <ProtectedRoute component={AdminCardNew} roleRequired="admin" />}
      </Route>
      <Route path="/admin/cards/:id">
        {(params) => <ProtectedRoute component={AdminCardEdit} roleRequired="admin" id={params.id} />}
      </Route>
      <Route path="/admin/reflections">
        {() => <ProtectedRoute component={AdminReflections} roleRequired="admin" />}
      </Route>

      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}
