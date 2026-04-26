import { useEffect, useState } from "react";
import { Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Chip } from "@mui/material";
import { staffAPI } from "../../services/api";

export default function StaffDashboardPage() {
  const [complaints, setComplaints] = useState([]);

  const load = () => {
    staffAPI.getComplaints().then(({ data }) => setComplaints(data.complaints || [])).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const markDone = async (id) => {
    await staffAPI.markDone(id);
    load();
  };

  return (
    <Box>
      <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: 2, mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Staff Dashboard</Typography>
        <Typography color="text.secondary">Assigned complaints from admin</Typography>
      </Paper>

      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {complaints.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.student?.user?.fullName}</TableCell>
                <TableCell>{c.title}</TableCell>
                <TableCell><Chip label={c.status} size="small" /></TableCell>
                <TableCell>
                  <Button size="small" variant="contained" onClick={() => markDone(c.id)} disabled={c.status === "DoneByStaff" || c.status === "Resolved" || c.status === "Closed"}>Done</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
