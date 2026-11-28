"use client";
import { Datatable, Popup, Form, Icon } from "@/components";
import { Page, api, loadData } from "@/util";
import { useForm } from "react-hook-form";
import { Grid } from "@mui/material";
import React from "react";
import { useToast } from "@/hooks";

export default function appPage() {
    const [apps, setApps] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [token, setToken] = React.useState(null);
    const [app, setApp] = React.useState({ open: false, id: null });
    const [reload, setReload] = React.useState(0);
    const refresh = () => setReload((n) => n + 1);
    React.useEffect(() => {
        setIsLoading(true);
        loadData(
            api.get("/api/v1/user/apps"),
            (resp) => {
                setApps(Array.isArray(resp?.data) ? resp.data : []);
            },
            () => {
                setIsLoading(false);
            },
        );
    }, [reload]);
    const setActive = async (id, isActive) => {
        const resp = await api.patch("/api/v1/user/apps", { _id: id, isActive });
        useToast(resp);
        refresh();
    };
    return (
        <Page.Box
            sx={{
                bgcolor: (theme) => theme.palette.page.main,
                p: { xs: 2, md: 3 },
            }}
        >
            <Datatable
                isLoading={isLoading}
                data={apps}
                columns={[
                    {
                        id: "actions",
                        label: "Actions",
                        width: "150px",
                        align: "center",
                        render: (info) => (
                            <Page.Box
                                display="flex"
                                alignItems="center"
                                gap={2}
                                mx={1}
                                justifyContent="center"
                            >
                                <Icon
                                    iconClass="fa fa-edit"
                                    onClick={() => {
                                        setApp({
                                            open: true,
                                            id: info._id,
                                            appName: info.name.first,
                                        });
                                    }}
                                    style={{ color: "#035f87", fontSize: 16 }}
                                    sx={{ m: 0 }}
                                    label="Change App Name"
                                />
                                <Icon
                                    iconClass="fa fa-lock"
                                    onClick={async () => {
                                        let resp = await api.post("/api/v1/user/apps", {
                                            _id: info._id,
                                        });
                                        if (resp?.data?.token) {
                                            setToken(resp.data.token);
                                            refresh();
                                        } else {
                                            useToast(resp);
                                        }
                                    }}
                                    style={{ color: "#035f87", fontSize: 16 }}
                                    sx={{ m: 0 }}
                                    label="Generate app token"
                                />
                                {info.isActive ? (
                                    <Icon
                                        iconClass="fa fa-ban"
                                        onClick={() => setActive(info._id, false)}
                                        label="Switch app off (its token stops working)"
                                        style={{ color: "rgba(237, 89, 89, 1)", fontSize: 16 }}
                                        sx={{ m: 0 }}
                                    />
                                ) : (
                                    <Icon
                                        iconClass="fa fa-circle-check"
                                        onClick={() => setActive(info._id, true)}
                                        label="Switch app on"
                                        style={{ color: "#59AC77", fontSize: 16 }}
                                        sx={{ m: 0 }}
                                    />
                                )}
                            </Page.Box>
                        ),
                    },
                    {
                        id: "fullName",
                        data: "fullName",
                        label: "App Name",
                        width: "350px",
                    },
                    {
                        id: "tokenIssuedAt",
                        label: "Token made",
                        width: "220px",
                        render: (info) => (info.tokenIssuedAt ? new Date(info.tokenIssuedAt).toLocaleString() : "No token yet"),
                    },
                    {
                        id: "lastUsedAt",
                        label: "Last used",
                        width: "220px",
                        render: (info) => (info.lastUsedAt ? new Date(info.lastUsedAt).toLocaleString() : "Never"),
                    },
                ]}
                add={() => {
                    setApp({ open: true, id: null, appName: "" });
                }}
                title={"Integrated Applications"}
            />
            <Popup.SideDrawer
                open={app.open}
                onClose={() => setApp({ open: false, id: null, appName: "" })}
                title={app.id ? "Edit Application" : "Add New Application"}
            >
                <AppForm
                    id={app.id}
                    appName={app.appName}
                    onClose={() => {
                        setApp({ open: false, id: null });
                        refresh();
                    }}
                />
            </Popup.SideDrawer>
            <Popup.Popup
                open={Boolean(token)}
                onClose={() => setToken(null)}
                title={"Token"}
                onCopy={() => {
                    navigator.clipboard.writeText(token);
                    useToast({
                        message: "Token copied to clipboard",
                        status: "success",
                    });
                }}
            >
                <Page.Box p={2}>
                    <Page.Text variant="body2" sx={{ mb: 1 }}>
                        Copy this token now: it is shown only once. Send it in the Authorization header as Bearer, then the token.
                        Making a new token stops this one.
                    </Page.Text>
                    <Page.Text variant="body1" sx={{ wordBreak: "break-all" }}>
                        {token}
                    </Page.Text>
                </Page.Box>
            </Popup.Popup>
        </Page.Box>
    );
}

function AppForm({ id, onClose, appName = "" }) {
    const form = useForm({
        name: { first: appName, last: "app" },
        gender: "Other",
        dob: new Date().setFullYear(new Date().getFullYear() - 18),
        isVerified: { email: "verified" },
        role: "root",
    });
    React.useEffect(() => {
        form.reset({
            name: { first: appName, last: "app" },
            gender: "Other",
            dob: new Date().setFullYear(new Date().getFullYear() - 18),
            isVerified: { email: "verified" },
            role: "root",
        });
    }, [appName, id]);
    return (
        <Grid
            component="form"
            onSubmit={form.handleSubmit(async (formData) => {
                let resp = id
                    ? await api.patch("/api/v1/user/apps", { ...formData, _id: id })
                    : await api.put("/api/v1/user/apps", formData);
                useToast(resp);
                onClose();
            })}
            container
            spacing={2}
            size={12}
            sx={{
                bgcolor: "white",
                overflow: "hidden",
                borderRadius: "10px",
                boxShadow: 1,
                p: 2,
                alignSelf: "flex-start",
            }}
        >
            <Grid container size={12} spacing={1.4} sx={{ px: 2 }}>
                <Form.Input
                    control={form.control}
                    {...form.register("name.first")}
                    label="App Name"
                />
            </Grid>
            <Grid
                container
                size={12}
                sx={{
                    justifyContent: "flex-end",
                    mr: 2,
                }}
            >
                <Page.MuiButton
                    type="submit"
                    variant="contained"
                    color="secondary"
                    sx={{
                        fontWeight: "bold",
                    }}
                >
                    Submit
                </Page.MuiButton>
            </Grid>
        </Grid>
    );
}
