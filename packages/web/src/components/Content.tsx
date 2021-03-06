import { createStyles, makeStyles, Theme } from "@material-ui/core"
import clsx from "clsx"
import React from "react"

import NoteEditor from "src/components/NoteEditor"
import { MAX_DRAWER_WIDTH } from "src/constants"
import { EditContainer } from "src/controller/edit"
import { WorksapceStateContainer } from "src/controller/workspace-state/hook"

import Welcome from "./Welcome"

const useStyles = makeStyles((theme: Theme) => {
    const padding = theme.spacing(3)
    return createStyles({
        content: {
            padding: padding,
            transition: theme.transitions.create("padding", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
            }),

            width: "100%",
            height: "100vh",
            minHeight: "100vh",

            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
        },
        contentShift: {
            [theme.breakpoints.up("md")]: {
                paddingLeft: MAX_DRAWER_WIDTH + padding,
                transition: theme.transitions.create("padding", {
                    easing: theme.transitions.easing.easeOut,
                    duration: theme.transitions.duration.enteringScreen,
                }),
            },
        },
    })
})

const Content: React.FC = () => {
    const classes = useStyles()

    const { drawerActivity } = WorksapceStateContainer.useContainer()

    const { setNoteContent, note } = EditContainer.useContainer()

    return (
        <main className={clsx(classes.content, { [classes.contentShift]: drawerActivity })} data-testid="main">
            {note ? <NoteEditor note={note} setNoteContent={setNoteContent} autoFocus={false} key={note.key} /> : <Welcome />}
        </main>
    )
}
export default Content
