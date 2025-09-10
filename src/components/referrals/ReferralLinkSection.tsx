import React from 'react'

interface RefLinkTypes {
    sharableLink:string
}

const ReferralLinkSection = ({sharableLink}:RefLinkTypes) => {
  return (
    <div>
      {sharableLink}
    </div>
  )
}

export default ReferralLinkSection
