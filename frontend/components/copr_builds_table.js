import React, { useState, useEffect } from "react";

import {
    Table,
    TableHeader,
    TableBody,
    TableVariant,
    sortable,
    SortByDirection,
    cellWidth,
} from "@patternfly/react-table";

import { Button, Label, Tooltip } from "@patternfly/react-core";
import { ExternalLinkAltIcon } from "@patternfly/react-icons";

import ConnectionError from "./error";
import Preloader from "./preloader";

// Add every target to the chroots column and color code according to status
const StatusLabel = (props) => {
    let statusLabelList = [];
    let chroot;
    for (chroot in props.list) {
        switch (props.list[chroot]) {
            case "success":
                statusLabelList.push(
                    <Tooltip content={props.list[chroot]}>
                        <span style={{ padding: "2px" }}>
                            <Label color="green">{chroot}</Label>
                        </span>
                    </Tooltip>
                );
                break;
            case "failure":
                statusLabelList.push(
                    <Tooltip content={props.list[chroot]}>
                        <span style={{ padding: "2px" }}>
                            <Label color="red">{chroot}</Label>
                        </span>
                    </Tooltip>
                );
                break;
            default:
                statusLabelList.push(
                    <Tooltip content={props.list[chroot]}>
                        <span style={{ padding: "2px" }}>
                            <Label color="purple">{chroot}</Label>
                        </span>
                    </Tooltip>
                );
        }
    }
    return <div>{statusLabelList}</div>;
};

const CoprBuildsTable = () => {
    // Headings
    const column_list = [
        { title: "Trigger", transforms: [cellWidth(25)] },
        "Chroots",
        { title: "Time Submitted", transforms: [sortable, cellWidth(15)] },
        { title: "Build ID", transforms: [sortable, cellWidth(15)] },
        // "Ref",
    ];

    // Local State
    const [columns, setColumns] = useState(column_list);
    const [rows, setRows] = useState([]);
    const [hasError, setErrors] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [sortBy, setSortBy] = useState({});
    const [page, setPage] = useState(1);

    // Fetch data from dashboard backend (or if we want, directly from the API)
    function fetchData() {
        console.log(`Route is /api/copr-builds/?page=${page}&per_page=20`);
        fetch(`/api/copr-builds/?page=${page}&per_page=20`)
            .then((response) => response.json())
            .then((data) => {
                jsonToRow(data);
                setLoaded(true);
                setPage(page + 1); // set next page
            })
            .catch((err) => {
                console.log(err);
                setErrors(err);
            });
    }

    // Convert fetched json into row format that the table can read
    function jsonToRow(res) {
        let rowsList = [];

        // set suffix to be either PR ID or Branch Name depending on trigger
        const FindSuffix = (props) => {
            let jobSuffix = "";
            if (props.builds.pr_id) {
                jobSuffix = `#${props.builds.pr_id}`;
            } else if (props.builds.branch_name) {
                jobSuffix = `:${props.builds.branch_name}`;
            }
            return <>{jobSuffix}</>;
        };

        res.map((copr_builds) => {
            let singleRow = {
                cells: [
                    {
                        title: (
                            <strong>
                                <a target="_blank" href={copr_builds.web_url}>
                                    {copr_builds.repo_namespace}/
                                    {copr_builds.repo_name}
                                    <FindSuffix builds={copr_builds} />
                                </a>
                            </strong>
                        ),
                    },
                    {
                        title: (
                            <StatusLabel list={copr_builds.status_per_chroot} />
                        ),
                    },
                    copr_builds.build_submitted_time,
                    copr_builds.build_id,
                    // copr_builds.ref.substring(0, 8),
                ],
            };
            rowsList.push(singleRow);
        });
        // console.log(rowsList);
        setRows(rows.concat(rowsList));
    }

    function onSort(_event, index, direction) {
        const sortedRows = rows.sort((a, b) =>
            a[index] < b[index] ? -1 : a[index] > b[index] ? 1 : 0
        );
        setSortBy({
            index,
            direction,
        });
        setRows(
            direction === SortByDirection.asc
                ? sortedRows
                : sortedRows.reverse()
        );
    }

    // Load more items
    function nextPage() {
        // console.log("Next Page is " + page);
        fetchData();
    }

    // useEffect by default executes on every render of component
    // here we only need it to execute on mount / first render
    // so I simply added the second parameter (empty array three lines after this comment)

    // But if you want different behaviour for first render and updated render
    // look at https://stackoverflow.com/a/55075818/3809115
    // and add code after the last line of the if statement in the ans

    useEffect(() => {
        fetchData();
    }, []);

    // If backend API is down
    if (hasError) {
        return <ConnectionError />;
    }

    // Show preloader if waiting for API data
    if (!loaded) {
        return <Preloader />;
    }

    return (
        <div>
            <Table
                aria-label="Sortable Table"
                variant={TableVariant.compact}
                sortBy={sortBy}
                onSort={onSort}
                cells={columns}
                rows={rows}
            >
                <TableHeader />
                <TableBody />
            </Table>
            <center>
                <br />
                <Button variant="control" onClick={nextPage}>
                    Load More
                </Button>
            </center>
        </div>
    );
};

export default CoprBuildsTable;