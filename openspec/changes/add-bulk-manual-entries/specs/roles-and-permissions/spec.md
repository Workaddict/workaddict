## MODIFIED Requirements

### Requirement: Creating other members' entries enforced in the storage layer
The storage adapter SHALL refuse to create an entry whose owner is not the acting user unless the acting user is an editor or team leader. In that case it SHALL write nothing and throw `forbiddenRole`. When several entries are created together, the adapter SHALL check every entry before writing and SHALL write nothing if any entry is refused.

#### Scenario: Worker creates entry for another member
- **WHEN** a worker's adapter is asked to save a new entry whose login is `bob`
- **THEN** it writes nothing and throws `forbiddenRole`

#### Scenario: Editor creates entry for another member
- **WHEN** editor `alice`'s adapter saves a new entry whose login is `bob`
- **THEN** the entry is written to `bob`'s entry file with `alice` recorded as the adder

#### Scenario: Worker creates entries for several members
- **WHEN** a worker's adapter is asked to save new entries for themselves and for `bob` together
- **THEN** it writes nothing, not even the worker's own entry, and throws `forbiddenRole`

#### Scenario: Editor creates entries for several members
- **WHEN** editor `alice`'s adapter saves new entries for `alice`, `bob`, and `carol` together
- **THEN** each entry is written to its owner's entry file in one commit, and `bob`'s and `carol`'s entries record `alice` as the adder
