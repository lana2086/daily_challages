import { AdminLayout } from "@/components/layout";
import {
  useGetParticipant,
  useGetParticipantProgress,
  getGetParticipantQueryKey,
  getGetParticipantProgressQueryKey,
} from "@workspace/api-client-react";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import Passport from "@/components/passport.tsx";
import { ChevronLeft, Plus } from "lucide-react";
import { Link } from "wouter";

export default function AdminParticipantDetail({ id }: { id: string }) {
  const pId = parseInt(id, 10);
  const { data: participant, isLoading: isPLoading } = useGetParticipant(pId, {
    query: { queryKey: getGetParticipantQueryKey(pId) },
  });
  const { data: progress, isLoading: isProgLoading } =
    useGetParticipantProgress(pId, {
      query: { queryKey: getGetParticipantProgressQueryKey(pId) },
    });

  if (isPLoading || isProgLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center p-10">
          <Spinner />
        </div>
      </AdminLayout>
    );
  }

  if (!participant) return <AdminLayout>Not found</AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/participants"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-serif font-bold">
              {participant.name}
            </h1>
            <p className="text-muted-foreground">@{participant.username}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Challenges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {progress?.totalBoxes || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {progress?.completed || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Reflections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {progress?.reflectionsCount || 0}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Passport */}

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">📖 Passport</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex justify-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Open Passport</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md p-0 overflow-y-auto max-h-[90vh] bg-transparent border-none shadow-none">
                    <DialogHeader className="sr-only">
                      <DialogTitle>{participant.name}'s Passport</DialogTitle>
                      <DialogDescription>
                        Edit the participant's passport. Changes save
                        automatically.
                      </DialogDescription>
                    </DialogHeader>
                    <Passport participantId={pId} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 border-t pt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-serif font-semibold">Bingo Cards</h2>
            <Link
              href={`/admin/cards/new?userId=${id}`}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
            >
              <Plus className="w-4 h-4 mr-2" /> New Card
            </Link>
          </div>
          {/* Note: In a full app we'd fetch the participant's cards. We'll show a message or redirect to cards list if they had an endpoint. */}
          <div className="p-8 text-center border rounded-md bg-muted/30">
            <p className="text-muted-foreground">
              Participant's card management is accessible via the Cards module.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
